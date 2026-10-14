import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { LibvirtStatus, VmDetails, VmInfo, CreateDomainOptions } from './libvirt.types';

const execFileAsync = promisify(execFile);

// Strict identifier whitelist: UUID or alphanumeric domain names with dashes/underscores
const VALID_VM_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;

@Injectable()
export class LibvirtService {
  private readonly logger = new Logger(LibvirtService.name);
  private readonly virshPath = process.env.LIBVIRT_VIRSH_PATH || '/usr/bin/virsh';
  private readonly libvirtUri = process.env.LIBVIRT_URI || 'qemu:///system';
  private readonly timeoutMs = 15000;
  private readonly maxBuffer = 1024 * 1024; // 1 MB limit

  /**
   * Safely execute a virsh command with fixed arguments and no shell invocation.
   */
  async runVirsh(args: string[], readonly = false): Promise<{ stdout: string; stderr: string }> {
    const finalArgs = ['-c', this.libvirtUri];
    if (readonly) {
      finalArgs.push('--readonly');
    }
    finalArgs.push(...args);

    try {
      return await execFileAsync(this.virshPath, finalArgs, {
        timeout: this.timeoutMs,
        maxBuffer: this.maxBuffer,
        shell: false,
      });
    } catch (err: unknown) {
      const error = err as { code?: number | string; stderr?: string; message?: string };
      const stderr = error.stderr || error.message || '';

      this.logger.warn(`virsh command failed [${args.join(' ')}]: ${stderr.trim()}`);

      if (
        stderr.includes('Failed to connect socket') ||
        stderr.includes('failed to connect to the hypervisor') ||
        stderr.includes('Cannot recv data') ||
        stderr.includes('Connection refused')
      ) {
        throw new ServiceUnavailableException(
          'Hypervisor connection error: libvirt service is unavailable on the host.',
        );
      }

      throw err;
    }
  }

  /**
   * Check connection status to local libvirt hypervisor.
   */
  async getStatus(): Promise<LibvirtStatus> {
    try {
      const { stdout: uriOut } = await this.runVirsh(['uri'], true);
      const { stdout: verOut } = await this.runVirsh(['version'], true);

      let version = 'unknown';
      const verMatch = verOut.match(/Compiled against library:\s*libvirt\s*([\d.]+)/i) ||
        verOut.match(/Using library:\s*libvirt\s*([\d.]+)/i);
      if (verMatch) {
        version = verMatch[1];
      }

      return {
        connected: true,
        hypervisor: uriOut.trim(),
        version,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown hypervisor error';
      return {
        connected: false,
        error: message,
      };
    }
  }

  /**
   * List all domains/VMs (running and shut off).
   */
  async listVms(): Promise<VmInfo[]> {
    const { stdout } = await this.runVirsh(['list', '--all'], true);
    const lines = stdout.split('\n');
    const vms: VmInfo[] = [];

    let headerPassed = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('---')) {
        headerPassed = true;
        continue;
      }

      if (!headerPassed) continue;

      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const id = parts[0];
        const name = parts[1];
        const state = parts.slice(2).join(' ');
        vms.push({ id, name, state });
      }
    }

    return vms;
  }

  /**
   * Get domain information by name or ID.
   */
  async getVm(id: string): Promise<VmDetails | null> {
    if (!VALID_VM_ID_REGEX.test(id)) {
      throw new BadRequestException(
        `Invalid VM identifier '${id}'. Identifiers must be alphanumeric with hyphens or underscores.`,
      );
    }

    try {
      const { stdout } = await this.runVirsh(['dominfo', id], true);
      const details: Partial<VmDetails> = { id };

      const lines = stdout.split('\n');
      for (const rawLine of lines) {
        const colonIdx = rawLine.indexOf(':');
        if (colonIdx === -1) continue;

        const key = rawLine.substring(0, colonIdx).trim().toLowerCase();
        const value = rawLine.substring(colonIdx + 1).trim();

        if (key === 'id') details.id = value;
        else if (key === 'name') details.name = value;
        else if (key === 'uuid') details.uuid = value;
        else if (key === 'os type') details.osType = value;
        else if (key === 'state') details.state = value;
        else if (key === 'cpu(s)') details.cpu = parseInt(value, 10);
        else if (key === 'max memory') details.maxMemoryKb = parseInt(value, 10);
        else if (key === 'used memory') details.usedMemoryKb = parseInt(value, 10);
      }

      if (!details.name) {
        return null;
      }

      return details as VmDetails;
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const msg = error.stderr || error.message || '';
      if (
        msg.includes('failed to get domain') ||
        msg.includes('Domain not found')
      ) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Create a CoW disk volume backed by base-cloud.qcow2
   */
  async createCoWVolume(volName: string, capacityGb: number, backingVol = 'base-ubuntu-24.04.qcow2', pool = 'default'): Promise<void> {
    this.logger.log(`Creating CoW volume '${volName}' (${capacityGb}G) backed by '${backingVol}'`);
    await this.runVirsh([
      'vol-create-as',
      pool,
      volName,
      `${capacityGb}G`,
      '--format',
      'qcow2',
      '--backing-vol',
      backingVol,
      '--backing-vol-format',
      'qcow2',
    ]);
  }

  /**
   * Define and boot a domain using virt-install with automated cloud-init support
   */
  async createAndStartDomain(
    name: string,
    vcpus: number,
    memoryMb: number,
    volName: string,
    network = 'Dbaas-Net',
    options?: CreateDomainOptions,
  ): Promise<void> {
    this.logger.log(`Launching KVM domain '${name}' (vCPUs: ${vcpus}, RAM: ${memoryMb}MB)`);

    const virtInstallArgs: string[] = [
      '--connect', this.libvirtUri,
      '--name', name,
      '--memory', memoryMb.toString(),
      '--vcpus', vcpus.toString(),
      '--disk', `vol=default/${volName}`,
      '--network', `network=${network},model=virtio`,
      '--import',
      '--noautoconsole',
      '--graphics', 'none',
    ];

    const ciDir = path.join('/tmp', `cloudinit-${name}`);
    if (!fs.existsSync(ciDir)) {
      fs.mkdirSync(ciDir, { recursive: true });
    }

    const metaData = `instance-id: ${name}\nlocal-hostname: ${name}\n`;
    const netConfig = options?.ipAddress
      ? `version: 2
ethernets:
  enp1s0:
    dhcp4: false
    addresses:
      - ${options.ipAddress}/24
    routes:
      - to: default
        via: ${options.gateway || '10.50.0.1'}
    nameservers:
      addresses:
        - 8.8.8.8
        - 1.1.1.1
`
      : `version: 2
ethernets:
  enp1s0:
    dhcp4: true
    dhcp4-overrides:
      use-routes: false
      use-dns: false
    routes:
      - to: default
        via: ${options?.gateway || '10.50.0.1'}
    nameservers:
      addresses:
        - 8.8.8.8
        - 1.1.1.1
`;

    const dbPwd = options?.dbPassword || '5a2191ba39192ca6c408598714ad34ac';
    const rootPwd = options?.adminPassword || '123';
    const engine = (options?.dbEngine || 'POSTGRESQL').toUpperCase();

    let dbSetupScript = '';
    if (engine === 'POSTGRESQL' || engine === 'POSTGRES') {
      dbSetupScript = `#!/bin/bash
set -x
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y postgresql postgresql-contrib

CONF_FILE=$(find /etc/postgresql/ -name postgresql.conf 2>/dev/null | head -n 1)
HBA_FILE=$(find /etc/postgresql/ -name pg_hba.conf 2>/dev/null | head -n 1)
if [ -n "$CONF_FILE" ]; then
  sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$CONF_FILE"
  sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" "$CONF_FILE"
fi
if [ -n "$HBA_FILE" ]; then
  echo "host all all 0.0.0.0/0 md5" >> "$HBA_FILE"
fi

systemctl restart postgresql
sleep 2
su - postgres -c "psql -c \\"CREATE USER dbaas_admin WITH ENCRYPTED PASSWORD '${dbPwd}';\\""
su - postgres -c "psql -c \\"ALTER USER dbaas_admin WITH SUPERUSER;\\""
su - postgres -c "psql -c \\"CREATE DATABASE dbaas_main OWNER dbaas_admin;\\""
systemctl restart postgresql
`;
    } else {
      dbSetupScript = `#!/bin/bash
set -x
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl gnupg
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo 'deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
systemctl daemon-reload
systemctl enable --now mongod
sleep 3
mongosh admin --eval '
  db.createUser({
    user: "dbaas_admin",
    pwd: "${dbPwd}",
    roles: [
      { role: "root", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" },
      { role: "dbAdminAnyDatabase", db: "admin" }
    ]
  });
'
sed -i 's/#security:/security:\\n  authorization: enabled/' /etc/mongod.conf
systemctl restart mongod
`;
    }

    const userData = `#cloud-config
password: "${rootPwd}"
chpasswd:
  list: |
    ubuntu:${rootPwd}
    root:${rootPwd}
  expire: False
ssh_pwauth: true
bootcmd:
  - ip route replace default via 10.50.0.1 || true
  - mkdir -p /etc/ssh/sshd_config.d
  - echo 'PasswordAuthentication yes' > /etc/ssh/sshd_config.d/01-pwauth.conf
  - echo 'KbdInteractiveAuthentication yes' >> /etc/ssh/sshd_config.d/01-pwauth.conf
  - echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config.d/01-pwauth.conf
  - sed -i "s/#DNS=/DNS=8.8.8.8 1.1.1.1/" /etc/systemd/resolved.conf || true
  - systemctl restart systemd-resolved || true
  - systemctl restart ssh.socket || systemctl restart ssh || true
runcmd:
  - ip route replace default via 10.50.0.1 || true
  - mkdir -p /etc/ssh/sshd_config.d
  - echo 'PasswordAuthentication yes' > /etc/ssh/sshd_config.d/01-pwauth.conf
  - echo 'KbdInteractiveAuthentication yes' >> /etc/ssh/sshd_config.d/01-pwauth.conf
  - echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config.d/01-pwauth.conf
  - systemctl restart ssh.socket || systemctl restart ssh || true
  - /root/setup_db.sh
write_files:
  - path: /root/setup_db.sh
    permissions: '0755'
    content: |
${dbSetupScript.split('\n').map((l) => (l ? '      ' + l : '')).join('\n')}
`;

    const metaPath = path.join(ciDir, 'meta-data');
    const netPath = path.join(ciDir, 'network-config');
    const userPath = path.join(ciDir, 'user-data');

    fs.writeFileSync(metaPath, metaData, 'utf-8');
    fs.writeFileSync(netPath, netConfig, 'utf-8');
    fs.writeFileSync(userPath, userData, 'utf-8');

    virtInstallArgs.push(
      '--osinfo',
      'ubuntu24.04',
      '--cloud-init',
      `user-data=${userPath},meta-data=${metaPath},network-config=${netPath}`,
    );

    await execFileAsync('/usr/bin/virt-install', virtInstallArgs, { timeout: 45000 });
  }

  /**
   * Start an existing domain
   */
  async startDomain(id: string): Promise<void> {
    this.logger.log(`Starting domain '${id}'`);
    await this.runVirsh(['start', id]);
  }

  /**
   * Stop an existing domain (graceful shutdown with fallback to destroy)
   */
  async stopDomain(id: string): Promise<void> {
    this.logger.log(`Stopping domain '${id}'`);
    try {
      await this.runVirsh(['destroy', id]);
    } catch {
      await this.runVirsh(['destroy', id]);
    }
  }

  /**
   * Restart an existing domain
   */
  async restartDomain(id: string): Promise<void> {
    this.logger.log(`Restarting domain '${id}'`);
    try {
      await this.runVirsh(['reboot', id]);
    } catch {
      await this.runVirsh(['reset', id]);
    }
  }

  /**
   * Delete an existing domain and its storage
   */
  async deleteDomain(id: string): Promise<void> {
    this.logger.log(`Deleting domain '${id}' and associated storage`);
    try {
      await this.runVirsh(['destroy', id]);
    } catch {
      // Ignore if already stopped
    }
    await this.runVirsh(['undefine', id, '--remove-all-storage']);
  }
}
