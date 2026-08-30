# RASD Deployment

Use the managed development, staging, and production environments. Required validation is `pnpm check`, `pnpm test`, and `pnpm build`. Database changes follow schema edit, migration generation, SQL review, and controlled migration execution. Rollback is performed through the project checkpoint/version history.
