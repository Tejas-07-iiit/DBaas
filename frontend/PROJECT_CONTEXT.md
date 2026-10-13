Frontend only. Read this file before every task. Sources of truth: this file and ENDPOINTS.md / src/config/endpoints.ts. If something is not in them, do not claim it; list it as NEEDS CONFIRMATION.

THE TRUTH
- DBaaS provides MongoDB, PostgreSQL and Qdrant in one platform with one dashboard (Projects, Databases, Team, Subscription, Usage, Settings).
- Sign-in is through Firebase; the backend (NestJS) verifies the token, enforces roles, checks subscription and plan limits, provisions databases, and acts as the gateway for ALL traffic. Customers NEVER connect directly to database servers.
- Databases run on Kubernetes, each customer in an isolated namespace with network policies and its own persistent storage, on a private isolated network.
- Provisioning is asynchronous (the API answers "accepted", then the database moves through states). Per database: start, stop, restart, delete, connection details, rotate credentials. Monitoring: metrics, logs, events; usage is tracked.
- Roles per project: Owner, Admin, Member. Plans come from GET /plans; billing through Stripe (checkout, cancel).
- A REST control-plane API with bearer-token authentication exists.
NOT backed, so NOT to be claimed: dedicated VM per database; connecting with psql/mongosh/drivers by host and port; regions/locations; uptime or SLA numbers; provisioning-time or latency numbers; autoscaling; point-in-time recovery; scheduled backups; SSO; IP allowlists; VPC peering; CLI; SDKs; Terraform/GitHub Actions integrations; API keys; replicas/failover; pooling; database extensions; a free tier (unknown until /plans says so); real customers or testimonials; Neo4j; any internal infrastructure details (IPs, KVM, laptop, Cloudflare).


Note: The infrastructure design is unconfirmed (VM/service vs Kubernetes) and public text stays neutral until confirmed.