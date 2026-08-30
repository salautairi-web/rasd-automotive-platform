# Role and Permission Matrix

| Role | Scope | Phase 1 capabilities |
|---|---|---|
| Administrator | Authorized organizations | Overview, integration intake, configuration, audit review |
| User | Granted organization/branch/unit | Read permitted dashboard data and assigned work |
| Auditor | Authorized organization | Read audit and reconciliation records |

The current scaffold preserves the built-in admin/user role model while accessGrants and permissions provide the extension point for scoped RBAC.
