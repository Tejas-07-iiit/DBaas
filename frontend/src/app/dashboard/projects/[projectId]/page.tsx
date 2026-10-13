/**
 * @file src/app/dashboard/projects/[projectId]/page.tsx
 * @description Project workspace overview dashboard.
 * Summarizes databases, active team members, and direct quick-navigation cards.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { getProject } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { listDatabases } from "@/lib/api/databases";
import { listMembers } from "@/lib/api/members";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import Link from "next/link";
import { use } from "react";

export default function ProjectOverview({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  
  const dbQuery = useQuery({ queryKey: ["databases", projectId], queryFn: () => listDatabases(projectId) });
  const memQuery = useQuery({ queryKey: ["members", projectId], queryFn: () => listMembers(projectId) });
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res: any = await getProject(projectId);
      return mapProject(res.data || res);
    },
    retry: false
  });

  if (isLoading) return <div>Loading project...</div>;
  if (error) {
    if ((error as any).status === 404) return <ErrorState message="Project not found" />;
    if ((error as any).status === 403) return <ErrorState message="No access to this project" />;
    return <ErrorState message="Could not load project" onRetry={refetch} />;
  }
  
  if (!data) return <ErrorState message="Could not load project" onRetry={refetch} />;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">{data.name}</h1>
        <RoleBadge role={data.role} />
      </div>
      <p className="text-muted mb-8 max-w-2xl">{data.description}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="p-4 bg-surface/30 border border-border/50 rounded-lg">
          <div className="text-xs font-mono text-muted mb-1">Your Role</div>
          <div className="font-bold">{data.role}</div>
        </div>
        <div className="p-4 bg-surface/30 border border-border/50 rounded-lg">
          <div className="text-xs font-mono text-muted mb-1">Created</div>
          <div className="font-bold">{new Date(data.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="p-4 bg-surface/30 border border-border/50 rounded-lg">
          <div className="text-xs font-mono text-muted mb-1">Databases</div>
          <Link href={`/dashboard/projects/${projectId}/databases`} className="text-accent text-sm hover:underline flex items-center gap-2 font-bold text-lg">{dbQuery.isLoading ? "..." : (dbQuery.data as any)?.length || 0} Open →</Link>
        </div>
      
        <div className="p-4 bg-surface/30 border border-border/50 rounded-lg">
          <div className="text-xs font-mono text-muted mb-1">Members</div>
          <Link href={`/dashboard/projects/${projectId}/team`} className="text-accent text-sm hover:underline flex items-center gap-2 font-bold text-lg">{memQuery.isLoading ? "..." : (memQuery.data as any)?.data?.length || (memQuery.data as any)?.length || 0} Members →</Link>
        </div>
      </div>
    </div>
  );
}
