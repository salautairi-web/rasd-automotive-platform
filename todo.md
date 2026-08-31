# Project TODO

- [x] Define the Phase 1 modular-monolith boundaries and shared domain vocabulary.
- [x] Add multi-company, branch, business-unit, department, cost-center, warehouse, and location schema with tenant-scope fields.
- [x] Add centralized customer, vehicle, and product master records with stable RASD identifiers and configurable numbering.
- [x] Add role, permission-scope, organizational-access, and protected audit-log data structures.
- [x] Add event catalog, event persistence, retry state, commands, workflows, tasks, comments, and attachment metadata structures.
- [x] Add secure object-storage metadata integration without storing large file bytes in the database.
- [x] Add backend procedures with validation, authorization, correlation IDs, and idempotency for critical operations.
- [x] Add Arabic-first RTL/LTR RASD management dashboard with responsive layout and shared design system.
- [x] Add tRPC-backed module data reads for organization, master data, integration, workflows, tasks, and documents with scoped empty fallbacks.
- [x] Tie permission-denied state to backend authorization failures; loading, error, empty, and coming-soon states are implemented.
- [x] Add Phase 1 seed script for organization structure, permissions, and numbering/master-data baselines without fabricated reviews or testimonials.
- [x] Create PROJECT_ARCHITECTURE.md.
- [x] Create DATABASE_SCHEMA.md.
- [x] Create API_SPECIFICATION.md.
- [x] Create EVENT_CATALOG.md.
- [x] Create ACCOUNTING_RULES.md.
- [x] Create SECURITY_MODEL.md.
- [x] Create ROLE_PERMISSION_MATRIX.md.
- [x] Create WORKFLOW_CATALOG.md.
- [x] Create DEPLOYMENT.md.
- [x] Create TEST_PLAN.md.
- [x] Update CHANGELOG.md.
- [x] Add Vitest coverage for validation and authorization; idempotency and retry behavior are represented in the data model and remain for the next phase.
- [x] Run type checks, tests, production build, and visual verification at desktop breakpoint.
- [x] Review all completed TODO items before checkpoint and delivery.

## History

- Initial Phase 1 scope captured from the supplied RASD Master Build Specification.

## Gap closure tasks

- [x] Add departments, warehouses, and locations tables plus tenant-scope relations/migrations.
- [x] Implement configurable numbering services/procedures that generate stable customer, vehicle, and product IDs from numbering rules.
- [x] Add task comments and explicit attachment-linking structures for workflow/task collaboration.
- [x] Implement secure object-storage upload/list/download flows and persist only metadata/reference keys.
- [x] Enforce idempotency for critical mutations using persisted idempotency keys and request hashing.
- [x] Persist RTL/LTR direction across all module workspaces; responsive RTL verification completed and LTR behavior is wired for follow-up visual QA.
- [x] Replace module reads with tRPC-backed data where persisted records exist; mutation forms remain staged for the next operational phase.
- [x] Connect the permission-denied frontend state to actual tRPC authorization failures.

## Verification follow-up

- [x] Implement tenant-scoped numbering and use generated identifiers in customer, vehicle, and product creation flows.
- [x] Add document list and secure download procedures using stored metadata and signed storage URLs.
- [x] Add idempotency conflict detection and replay-safe response handling; deeper integration fixtures remain a next-phase test expansion.
- [x] Persist and apply the RTL/LTR direction across all module pages; mobile RTL and desktop RTL verified, with LTR wiring ready for QA.
- [x] Replace remaining module reads with tRPC-backed data and retain clearly labeled staged actions for future mutation flows.
- [x] Handle backend authorization failures in the frontend permission-denied state.

## Final backend correctness

- [x] Scope numbering rules by organizationId and use generated identifiers in master-record creation flows.
- [x] Implement replay-safe idempotency conflict handling; typed replay fixtures are documented as next-phase hardening.

## Final module-view correction

- [x] Remove hardcoded module row fallbacks and use true live empty states or seed-backed data.
- [x] Add backend FORBIDDEN checks for restricted module reads and connect the resulting denial UI.
- [x] Expand moduleRows coverage for operational workspaces and remove static row fallbacks; settings remains configuration-only.

## Step 2 — Central ERP + Independent Business Entities

- [x] Add Business Entity Registry with entity type, parent company, currency, timezone, status, and no operational master data.
- [x] Correct Phase 1 operational master records from organization-scoped to entity-scoped ownership without deleting existing data.
- [x] Remove the global VIN uniqueness assumption and add entity-scoped customer, vehicle, and product boundaries; supplier/inventory vertical slices are staged.
- [x] Add independent accounting books and ERP accounting core tables.
- [x] Add chart of accounts, fiscal periods, validated journal envelopes/lines, and the ERP accounting foundation; AR/AP, cash, banks, assets, budgets, taxes, and exchange rates are staged vertical slices.
- [x] Add inter-entity transaction and portfolio metric foundations; reconciliations, capital contributions, and entity loans are staged.
- [x] Add consolidation run state that preserves local ledgers; exception processing is staged.
- [x] Add Central ERP procedures for entity registry, accounting validation, and portfolio overview; posting/consolidation/inter-entity command vertical slices are staged.
- [x] Add Step 2 executive ERP dashboard routes with entity-scoped visibility and integration health.
- [x] Add independence and accounting invariant tests plus existing duplicate-event/retry foundation tests; full consolidation fixtures are staged.
- [x] Update architecture, database, API, event, security, and test documentation for the Step 2 correction.
- [x] Verify implemented Step 2 foundation criteria and save a checkpoint.

## Step 2 correctness hardening

- [x] Require businessEntityId in customer, vehicle, and product creation contracts; existing nullable rows are preserved under the documented migration plan.
- [x] Add supplier and inventory entity-boundary schema; protected CRUD vertical slices remain staged behind the boundary.
- [x] Add validated-to-posted and posted-to-reversed journal workflow with immutable state transitions; period-close enforcement remains a next slice.
- [x] Add inter-entity reconciliation, capital contribution, entity loan, and consolidation exception structures; full operational procedures remain staged.
- [x] Expose live portfolio and integration/task health foundations in the Central ERP dashboard; cash and AR/AP metric slices remain staged.
- [x] Add entity-local and accounting invariant tests plus existing duplicate-event/conflict foundation coverage; full consolidation integration fixtures remain staged.
- [x] Update existing architecture, API, security, and test documentation and add the Step 2 architecture/acceptance reference.

## Step 2 final verification gaps

- [x] Document the existing-record backfill strategy and apply businessEntityId to entity-scoped reads/lists; nullable legacy rows remain preserved for controlled migration.
- [x] Add journal lifecycle guards and balanced-journal tests; posted/reversed transitions are status-gated and immutable through exposed procedures.
- [x] Build Central ERP live entity, accounting-book, portfolio, and integration/task health foundations without hardcoded entity rows; cash and AR/AP remain staged vertical slices.
- [x] Add entity-local and accounting workflow invariant tests plus Phase 1 duplicate-event/conflict coverage.
- [x] Update the existing database/event-related architecture references and add Step 2 API, acceptance, security, and test documentation.

## Step 2 evidence completion

- [x] Add an explicit legacy-row backfill plan and apply entity scope consistently to relevant master-data reads.
- [x] Make portfolio period input-driven and add a combined Central ERP overview procedure/view.
- [x] Add Vitest coverage for entity/accounting invariants and retain the protected replay/lifecycle procedures for integration expansion.
- [x] Update DATABASE_SCHEMA.md and EVENT_CATALOG.md with independent-entity boundaries.

## Step 2 delivery completion

- [x] Build a real Central ERP overview view that renders live executive metrics from erp.executiveOverview.
- [x] Preserve protected idempotent replay/hash-conflict behavior and cover core invariants in the Step 2 test suite.
- [x] Implement and validate validated-to-posted and posted-to-reversed journal lifecycle guards.

## Step 3 — Auto Sales in an Independent Entity

- [x] Add entity-scoped Auto Sales registry, customers, and lead foundation; opportunities and representative management are staged.
- [x] Add independent vehicle inventory availability, reservations, discount threshold approval, and local cost structures; price lists/promotions are staged.
- [x] Add quotations, reservations, sales orders, invoices, payments, and delivery records; line-item and contract vertical slices are staged.
- [x] Enforce entity ownership, ready-state reservation availability, entity idempotency, and delivery preconditions.
- [x] Add protected quotation, discount approval, reservation, payment replay, and delivery lifecycle procedures; full lead/contract automation is staged.
- [x] Establish event/command integration boundary and Central ERP financial handoff contract without direct cross-entity database access.
- [x] Add Arabic-first Auto Sales workspace with live inventory and sales-control indicators; quotations and delivery operational panels are staged.
- [x] Add tests for entity-local rules, reservation availability, approval thresholds, delivery safeguards, and idempotency foundations.
- [x] Add Step 3 Auto Sales architecture, boundary, lifecycle, and acceptance documentation.
- [x] Verify the delivered Step 3 foundation with TypeScript, 11 passing tests, production build, and responsive visual verification.

## Step 3 correctness hardening

- [x] Add persisted quotation discount approvals and a threshold-driven approval state; approval decision mutations remain a follow-up slice.
- [x] Enforce same-entity ownership for customer, vehicle, invoice, and sales-order references in the implemented sales mutations.
- [x] Validate real same-entity sales-order state and reserved vehicle state before vehicle delivery.
- [x] Establish persisted Auto Sales event/ERP handoff boundary in the domain model and procedures; downstream adapters remain staged.
- [x] Add lifecycle rule tests for reservation, approval, delivery, and idempotency foundations; database integration fixtures remain staged.
- [x] Run desktop and mobile visual QA for the Step 3 Auto Sales workspace.

## Step 3 evidence hardening

- [x] Persist Auto Sales lifecycle events and ERP handoff envelopes from quotation, reservation, payment, and delivery mutations using the existing integration infrastructure.
- [x] Add protected procedure-contract tests for entity scope, authentication, and idempotency validation alongside lifecycle conflict rules.
- [x] Re-run final desktop and mobile visual QA for /sales after all hardening edits.

## Step 3 database-backed procedure evidence

- [x] Add procedure-level same-entity denial coverage using mismatched persisted records.
- [x] Add procedure-level reservation/payment replay and delivery-precondition coverage.

## Step 3 explicit cross-entity evidence

- [x] Add a procedure-level fixture where both related records exist but carry different businessEntityId values, and reject the mutation explicitly.

## Step 4 — Spare Parts Independent Entity

- [x] Add entity-scoped Spare Parts customers, suppliers, catalog, brands/categories/units, and vehicle-fitment structures; substitutes remain staged.
- [x] Add entity-scoped warehouses, stock balances, idempotent movements, reservations, and valuation foundations; bins/lots/counts/transfers are staged.
- [x] Add purchase orders, sales orders, invoices, reservations, and payments; requisitions/receipts/returns are staged vertical slices.
- [x] Enforce same-entity ownership, conditional stock availability, negative-stock prevention, and idempotent inventory movements.
- [x] Add minimum-margin rules, reorder points, low-stock alerts, and live stock valuation; aging analytics are staged.
- [x] Add protected procedures for catalog reads, stock reservation, issue, and payment with inter-entity-ready source fields.
- [x] Persist Parts reservation/payment lifecycle events and Central ERP financial handoff envelopes without direct cross-entity database access.
- [x] Add an Arabic-first Spare Parts workspace with live catalog, inventory valuation, low-stock, reservation, and receivable indicators.
- [x] Add tests for stock conflicts, negative-stock prevention, and pricing approvals alongside existing entity/idempotency suites.
- [x] Add Step 4 architecture, boundary, API behavior, security, and acceptance documentation.
- [x] Verify Step 4 with TypeScript, 21 passing tests, production build, desktop/mobile QA, and checkpoint review.

## Step 4 correctness hardening

- [x] Add protected Parts dashboard/catalog reads plus stock-reservation, issue, and payment flows; purchase-order, sales-order, and invoice creation remain staged vertical slices.
- [x] Validate entity/product/warehouse reservation ownership and prevent insufficient-stock and invalid issue transitions; explicit sales-order lookup is staged.
- [x] Add testable minimum-margin approval decisions for the next protected pricing mutation.
- [x] Add Parts invariant tests and retain procedure-level entity/idempotency coverage in the shared platform suites.
- [x] Add explicit Step 4 API, security, test, boundary, and acceptance coverage in STEP4_SPARE_PARTS.md.
- [x] Review the implemented Step 4 foundation after all validations pass and prepare its checkpoint.

## Step 4 delivery evidence

- [x] Add explicit API, security, test, and acceptance sections to the Step 4 documentation.
- [x] Perform the final TODO review and save the dedicated Step 4 checkpoint.

## Step 5 — Workshop Independent Entity

- [x] Add entity-scoped Workshop customers, vehicles, technicians, appointments, and reception-ready records; service advisors and bays are staged.
- [x] Add inspections, estimates, work orders, labor entries, parts requests, and quality checks; detailed operation lines and subcontracting are staged.
- [x] Add invoices, payments, delivery records, and local profitability references; warranty/comeback and local journal vertical slices are staged.
- [x] Add entity ownership checks plus testable work-order transitions, approval thresholds, and delivery safeguards; capacity scheduling is staged.
- [x] Add protected Workshop dashboard/work-order reads, entity-validated appointments, and idempotent parts-request procedures; remaining mutations are staged.
- [x] Persist Workshop appointment and parts-request events with inter-entity and ERP-ready envelopes.
- [x] Add an Arabic-first Workshop workspace with live appointments, work orders, waiting-parts, approval, and receivable foundations.
- [x] Add tests for work-order transitions, approval requirements, and delivery safeguards alongside platform entity/idempotency suites.
- [x] Add Step 5 boundary, API, security, test, and acceptance documentation.
- [x] Verify Step 5 with TypeScript, 24 passing tests, production build, and desktop/mobile QA; checkpoint pending final TODO review.

## Step 5 correctness hardening

- [x] Establish reception-ready appointment/customer/vehicle persistence; the explicit check-in mutation remains a staged vertical slice.
- [x] Add testable work-order transition and delivery guards; production transition/delivery mutations remain staged.
- [x] Add idempotent Workshop parts-request replay by entity/key; request-hash conflict hardening remains staged.
- [x] Add Workshop source/target entity event fields and ERP-ready event envelopes.
- [x] Add live appointment and work-order summary metrics to the Workshop workspace; appointment row view remains staged.
- [x] Add Workshop lifecycle tests alongside protected platform authentication/entity/idempotency suites.
- [x] Add explicit Step 5 API, security, test, and acceptance coverage in STEP5_WORKSHOP.md.
- [x] Perform final validation and prepare the Step 5 checkpoint after TODO review.

## Step 6 — Car Rental Independent Entity

- [x] تحليل مواصفات الخطوة السادسة وتثبيت حدود كيان التأجير المستقل.
- [x] إضافة أسطول التأجير المحلي وفئات المركبات وخطط الأسعار والفروع والمواقع.
- [x] إضافة العملاء والحجوزات والعقود والتسليم والإرجاع وبيانات التمديد الأساسية؛ إدارة السائقين التفصيلية مرحلة لاحقة.
- [x] إضافة سجلات الفحص والحالة والأضرار والودائع والفواتير والمدفوعات؛ المخالفات التفصيلية مرحلة لاحقة.
- [x] تطبيق عزل الكيان ومنع الحجز المتعارض والتحقق من ملكية العميل والمركبة وصحة الفترة.
- [x] إضافة إجراءات محمية للتوافر والحجز وقراءات العداد وطلبات الصيانة؛ نماذج العقد والتسليم والإرجاع التشغيلية مرحلة لاحقة.
- [x] إضافة تكامل الورشة وCentral ERP عبر أحداث وطلبات صيانة محكومة دون وصول مباشر للبيانات.
- [x] بناء لوحة تأجير عربية متجاوبة بمؤشرات الأسطول والعقود والتوافر والصيانة.
- [x] إضافة اختبارات تعارض الحجز وتراجع العداد واستحقاق الصيانة إلى اختبارات المنصة.
- [x] إضافة توثيق الخطوة السادسة للمعمارية وAPI والأمن والأحداث والاختبارات ومعايير القبول.
- [x] التحقق من TypeScript و27 اختباراً وبناء الإنتاج وواجهة سطح المكتب والجوال؛ checkpoint بعد مراجعة TODO.

## توسعة الخطوة السادسة — التشغيل المتقدم للتأجير

- [x] إضافة نماذج بيانات السائقين وتعديلات العقود وحالات التسليم والإرجاع التفصيلية.
- [x] إضافة سجلات أضرار المركبات والمخالفات المرورية ووثائق التأمين والمطالبات.
- [x] إضافة دورة الوديعة: الحجز والخصم والاسترداد مع معاملات Idempotent؛ الربط المالي المحاسبي التفصيلي مرحلة لاحقة.
- [x] إضافة إجراءات محمية لإنشاء العقد وتفعيله عبر التسليم وإرجاع المركبة؛ التمديد والإغلاق المحاسبي مرحلة لاحقة.
- [x] منع التسليم دون عقد صالح ومركبة مؤهلة، ومنع الإرجاع المكرر وقراءة العداد المتناقصة.
- [x] إضافة إجراءات محمية للأضرار ضمن الإرجاع والمخالفات والتأمين والودائع حسب نطاق الكيان.
- [x] بناء تجميع ربحية مباشر لكل مركبة للإيراد والمصروفات وصافي المساهمة والتنبيهات؛ snapshots والاستغلال التفصيلي مرحلة لاحقة.
- [x] إعداد نقطة Heartbeat آمنة لتنبيهات الصيانة حسب التاريخ والعداد وانتهاء التأمين دون مؤقتات داخلية.
- [x] بناء نماذج عربية تفاعلية للعقد والتسليم والإرجاع مع التحقق وحالات النجاح والخطأ.
- [x] بناء لوحة ربحية المركبات وتنبيهات الصيانة مع مرشح الفترة.
- [x] إضافة اختبارات تعارض الحجز والعداد ودورة العقد والوديعة والربحية والتنبيهات.
- [x] تحديث التوثيق والتحقق من TypeScript و30 اختباراً وبناء الإنتاج وواجهة سطح المكتب والجوال؛ checkpoint بعد مراجعة TODO.

## Step 7 — Import & Export Independent Entity

- [x] تحليل مواصفات الخطوة السابعة وتثبيت حدود كيان الاستيراد والتصدير المستقل.
- [x] إضافة الأطراف المحلية للموردين والعملاء والوكلاء والوسطاء والعملات؛ إدارة شروط التجارة التفصيلية مرحلة لاحقة.
- [x] إضافة طلبات الاستيراد والتصدير وبنودها وحالات الموافقة؛ رفع الوثائق مرحلة لاحقة.
- [x] إضافة الشحنات والحاويات والموانئ والناقلين والتتبع والمراحل.
- [x] إضافة بيانات التخليص الجمركي والرسوم والضرائب ورسوم الوسيط والفحص والموانئ.
- [x] إضافة مصروفات الشحنة ومحرك Landed Cost وتوزيع التكاليف حسب القيمة أو الوزن أو الكمية أو الحجم.
- [x] إضافة عناصر الشحن والمخزون العابر وحالات الاستلام والتحويل؛ المطالبات والاستثناءات مرحلة لاحقة.
- [x] تطبيق عزل الكيان وIdempotency ومنع تكرار التحويلات وضوابط حساب وإنهاء Landed Cost.
- [x] إضافة إجراءات محمية للشحنات والتكاليف وحساب التكلفة وإنهائها والتحويلات البينية.
- [x] بناء لوحة عربية متجاوبة للشحنات والجمارك والتكاليف والوصول القريب ومخاطر التكلفة.
- [x] إضافة اختبارات توازن Landed Cost وصحة الأساس وحالة الإنهاء إلى اختبارات المنصة.
- [x] تحديث التوثيق والتحقق من TypeScript و33 اختباراً وبناء الإنتاج والتحقق البصري المكتبي والجوال؛ checkpoint بعد مراجعة TODO.

## Step 8 — Portals + Central Identity

- [x] تحليل مواصفات الخطوة الثامنة وتثبيت حدود الهوية المركزية وعزل بيانات البوابات.
- [x] إضافة ملفات الهوية وبيانات الجلسات والأحداث الأمنية؛ تحدي MFA وإدارة الأجهزة الفعلية مرحلة لاحقة.
- [x] إضافة عضويات الكيانات والأدوار والنطاقات والفروع والأقسام والتواريخ والإلغاء.
- [x] إضافة ربط اختياري بالعميل أو المورد أو الشريك المحلي دون دمج السجلات التشغيلية.
- [x] إضافة دعوات البوابة وحالاتها وسجل تدقيق محكوم؛ قبول الدعوة التفاعلي مرحلة لاحقة.
- [x] تأسيس بوابة العميل للفواتير والمدفوعات والدعم والإشعارات ضمن سياق الكيان؛ محولات العقود مرحلة لاحقة.
- [x] تأسيس ملفات المورد والشريك والتذاكر والرسائل؛ محولات الطلبات والشحنات والوثائق مرحلة لاحقة.
- [x] تطبيق Session metadata وعزل الكيان ومنع IDOR بالتفويض الخلفي؛ تدفق MFA الكامل مرحلة لاحقة.
- [x] إضافة إجراءات tRPC محمية للعضويات وسياق البوابة والتذاكر وجلسات الدفع.
- [x] بناء واجهة عربية متجاوبة للبوابة ومبدّل الكيان وحالات عدم العضوية والوصول المرفوض.
- [x] إضافة اختبارات انتهاء وإلغاء العضوية وعزل الكيان وربط الملف وتطبيع الصلاحيات.
- [x] تحديث التوثيق والتحقق من TypeScript و36 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 9 — Central Operations, Commands, Tasks & Workflows

- [x] تحليل مواصفات الخطوة التاسعة وتثبيت حدود مركز العمليات وعدم الوصول المباشر لبيانات الكيانات.
- [x] إضافة أوامر مركزية بأنواع وبيانات هدف وأولوية؛ كتالوج القوالب المرئي وإصداراته مرحلة لاحقة.
- [x] إضافة أوامر التنفيذ ومحاولات التوجيه ونتائج الأخطاء وIdempotency وCorrelation IDs.
- [x] إضافة تعريفات سير العمل وإصداراتها وتشغيلاتها وحالاتها؛ المصمم المرئي للعقد والانتقالات مرحلة لاحقة.
- [x] إضافة المهام والإسناد والتعليقات والتبعيات والأولوية والاستحقاق ودليل الإكمال؛ مرفقات S3 مرحلة لاحقة.
- [x] إضافة الموافقات المرحلية والتفويض وقواعد SLA والتصعيد؛ الموافقات المتوازية والتذكيرات مرحلة لاحقة.
- [x] تطبيق صلاحية الإدارة المركزية ومنع التنفيذ المباشر وإجبار التوجيه عبر الأحداث والأوامر.
- [x] إضافة إجراءات محمية لإنشاء الأوامر والموافقة والتوجيه وإنشاء المهام وإكمالها وتقييم SLA.
- [x] إضافة بنية محاولات التوجيه والأحداث Idempotent؛ استهلاك نتائج الكيانات والتعويض مرحلة لاحقة.
- [x] بناء لوحة مركز عمليات عربية متجاوبة للأوامر والمهام والموافقات والتصعيد ونسبة الإنجاز.
- [x] إضافة اختبارات قواعد الموافقة والتوجيه والتبعيات ودليل الإكمال ومستوى التصعيد.
- [x] تحديث التوثيق والتحقق من TypeScript و39 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 10 — Central BI, Executive Reporting & Analytics

- [x] تحليل مواصفات الخطوة العاشرة وتثبيت مصادر البيانات وحدود العرض والتفصيل.
- [x] إضافة كتالوج مؤشرات مُصدر بالتعريف والصيغة والأبعاد والوحدة والتجميع وملكية النظام.
- [x] إضافة حقائق وسجل كيان SCD وsnapshots وفترات وعملات وسيناريوهات وجودة البيانات؛ نسب الصرف مرحلة لاحقة.
- [x] إضافة استيعاب حقائق Idempotent من الأحداث مع Source Lineage وإصدار التحويل ووقت التحديث.
- [x] تأسيس مؤشرات مالية وتشغيلية واستثمارية قابلة للإدخال والتجميع لكل كيان والمحفظة.
- [x] إضافة مقارنة الكيانات وانحراف الميزانية والتنبيهات؛ الاتجاهات والتنبؤات المادية مرحلة لاحقة.
- [x] تطبيق صلاحية BI مركزية وتصفية الكيان وتدقيق المشاهدة؛ أدوار Executive/Analyst/Entity مرحلة لاحقة.
- [x] إضافة إجراءات محمية للوحة والفترة والعملة والكيان واستيعاب المؤشرات؛ التصدير التفصيلي مرحلة لاحقة.
- [x] بناء لوحة تنفيذية عربية متجاوبة للمحفظة والكيانات والربحية وجودة البيانات والمخاطر.
- [x] إضافة اختبارات الإلغاء الداخلي وانحراف الميزانية وجودة البيانات إلى اختبارات المنصة.
- [x] تحديث التوثيق والتحقق من TypeScript و42 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 11 — Central Finance, Treasury & Investment Management

- [x] تحليل مواصفات الخطوة الحادية عشرة وتثبيت حدود الدفاتر المركزية والمحلية.
- [x] إضافة حسابات مركزية وخرائط مُصدرة وبنوك ولقطات أرصدة وتسويات؛ التوقعات النقدية المادية مرحلة لاحقة.
- [x] إضافة طلبات تمويل ومدفوعات وموافقات وحدود صرف؛ التحويلات التنفيذية بين الكيانات مرحلة لاحقة.
- [x] إضافة سجل استثمارات وتدفقات تمويل وتوزيع وعائد؛ القروض والجداول والتقييم المتقدم مرحلة لاحقة.
- [x] إضافة رأس المال المستثمر والملتزم والتدفقات والمحفظة؛ الاستدعاءات وسجل الملكية التفصيلي مرحلة لاحقة.
- [x] تطبيق Maker/Checker وحدود الموافقة والتدقيق وIdempotency للمدفوعات.
- [x] إضافة إجراءات محمية للسيولة وطلبات الدفع والموافقة والتمويل؛ التسوية والتنفيذ والتوزيع مرحلة لاحقة.
- [x] تثبيت حدود التكامل مع Central ERP وCentral BI دون تعديل دفاتر الكيانات مباشرة.
- [x] بناء لوحة مالية عربية متجاوبة للسيولة والتمويلات والاستثمارات وفروق التسوية.
- [x] إضافة اختبارات Maker/Checker وفروق التسوية وعائد الاستثمار إلى اختبارات المنصة.
- [x] تحديث التوثيق والتحقق من TypeScript و45 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 12 — Master Data Governance & Inter-Entity Transaction Engine

- [x] تثبيت قواعد ملكية البيانات الرئيسية والسياسات والإصدارات.
- [x] إضافة السجل المرجعي المركزي والخرائط وحالات التكرار؛ العلاقات المتقدمة بين الكيانات مرحلة لاحقة.
- [x] إضافة طلبات التغيير والموافقات وسجل الحوكمة؛ محرك جودة البيانات التفصيلي مرحلة لاحقة.
- [x] إضافة معاملات الكيانات وبنودها وموافقاتها ومطابقاتها وتسوياتها ونزاعاتها؛ مرفقات S3 مرحلة لاحقة.
- [x] تطبيق عزل المصدر والهدف وIdempotency وCorrelation IDs ومنع مشاركة قواعد البيانات.
- [x] إضافة إجراءات محمية للسجل والخرائط وإنشاء المعاملة والموافقة والمطابقة والتسوية والنزاع؛ قبول الهدف مرحلة لاحقة.
- [x] إضافة أحداث موافقة محكومة وHooks للإلغاء في Central Finance وCentral BI.
- [x] بناء لوحة عربية متجاوبة للحوكمة والمعاملات والتسويات والاستثناءات.
- [x] إضافة اختبارات المطابقة وتسلسل الحالات والتسوية الجزئية ومنع تجاوز الرصيد.
- [x] تحديث التوثيق والتحقق من TypeScript و48 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 13 — Procurement & Vendor Management Framework

- [x] تحليل مواصفات الخطوة الثالثة عشرة وتثبيت حدود المشتريات المركزية والمحلية.
- [x] إضافة سجل الموردين المحلي وتصنيفاتهم ووثائقهم وحالات التأهيل؛ الاتصالات التفصيلية مرحلة لاحقة.
- [x] إضافة التأهيل والمخاطر والامتثال والاعتماد والإيقاف؛ استبيان Due Diligence التفاعلي مرحلة لاحقة.
- [x] إضافة طلبات الشراء وبنودها وRFQ واستجابات الموردين ونموذج التقييم؛ الترسية التفاعلية مرحلة لاحقة.
- [x] إضافة أوامر الشراء وبنودها والعقود المُصدرة والاستلام والفحص؛ التعديلات والمرتجعات مرحلة لاحقة.
- [x] إضافة فواتير الموردين والمطابقة الثنائية والثلاثية؛ طلبات الدفع والمنازعات مرحلة لاحقة.
- [x] تطبيق عزل الكيان وحدود الموافقة وMaker/Checker ومنع الشراء من مورد غير مؤهل.
- [x] إضافة إجراءات محمية للموردين وطلبات الشراء والموافقة وأوامر الشراء والاستلام ومطابقة الفواتير.
- [x] إضافة أحداث استلام محكومة ونقاط تكامل مع Central Finance والحوكمة وBI.
- [x] بناء لوحة عربية متجاوبة للموردين والطلبات والعطاءات وأوامر الشراء والمخاطر.
- [x] إضافة اختبارات التأهيل والتقييم والموافقة والمطابقة الثلاثية وحدود Maker/Checker.
- [x] تحديث التوثيق والتحقق من TypeScript و52 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 14 — HR, Payroll & Workforce Management

- [x] تحليل مواصفات الخطوة الرابعة عشرة وتثبيت حدود بيانات الموظفين والرواتب لكل كيان.
- [x] إضافة ملفات الموظفين والعقود المُصدرة والوظائف والأقسام والفروع؛ المستندات الحساسة مرحلة لاحقة.
- [x] إضافة المناوبات والحضور Idempotent والانصراف والتأخير والخروج المبكر والإضافي.
- [x] إضافة أنواع الإجازات والأرصدة والطلبات ومنع الرصيد السالب؛ دورة الموافقة التفاعلية مرحلة لاحقة.
- [x] إضافة مكونات الراتب الأساسي والبدلات والإضافي والمكافآت والخصومات؛ القروض والمزايا التفصيلية مرحلة لاحقة.
- [x] إضافة فترات الرواتب والمسيرات وبنود الموظفين والموافقة والنشر؛ القسائم والبنوك والقيود المحلية مرحلة لاحقة.
- [x] إضافة الأداء وخطط التطوير وإنهاء الخدمة؛ التوظيف والتدريب والتأديب مرحلة لاحقة.
- [x] تطبيق عزل الكيان والخصوصية وMaker/Checker والتدقيق وIdempotency للعمليات الحساسة.
- [x] إضافة إجراءات محمية للموظفين والحضور والإجازات والرواتب والموافقة والنشر والتقارير.
- [x] إضافة أحداث EmployeeCreated وPayrollPosted وAccessRevocationRequested للتكامل مع الأنظمة المركزية.
- [x] بناء لوحة عربية متجاوبة للقوى العاملة والحضور والإجازات والرواتب والأداء.
- [x] إضافة اختبارات حساب الراتب والإجازات والحضور وMaker/Checker وحالة النشر.
- [x] تحديث التوثيق والتحقق من TypeScript و56 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 15 — Asset & Fixed Asset Management

- [x] تحليل مواصفات الخطوة الخامسة عشرة وتثبيت حدود ملكية الأصول لكل كيان.
- [x] إضافة فئات الأصول وسجل الأصول والمواقع والأوصاف والمراجع المحلية؛ المستندات والباركود مرحلة لاحقة.
- [x] إضافة الاقتناء والرسملة ومصادر التكلفة والعمر الإنتاجي والقيمة المتبقية.
- [x] إضافة قيود إهلاك فترية وطريقة القسط الثابت والترحيل؛ طرق الإهلاك الإضافية وإغلاق الفترة مرحلة لاحقة.
- [x] إضافة النقل والإسناد والصيانة والتوقف؛ الجرد والفروقات وفقد الأصول مرحلة لاحقة.
- [x] إضافة الانخفاض والاستبعاد والبيع والأرباح والخسائر؛ التحسين وإعادة التقييم مرحلة لاحقة.
- [x] تطبيق عزل الكيان والتدقيق وIdempotency؛ Maker/Checker وإغلاق الفترات مرحلة لاحقة.
- [x] إضافة إجراءات محمية لإنشاء الأصل ورسملته وإهلاكه واستبعاده؛ النقل والجرد كإجراءات تشغيلية مرحلة لاحقة.
- [x] إضافة أحداث AssetCapitalized وDepreciationPosted وAssetDisposed للتكامل المالي والتحليلي.
- [x] بناء لوحة عربية متجاوبة للقيمة الإجمالية والإهلاك والقيمة الدفترية والصيانة وسجل الأصول.
- [x] إضافة اختبارات حساب الإهلاك والقيمة المتبقية والرسملة والاستبعاد وحالة الترحيل.
- [x] تحديث التوثيق والتحقق من TypeScript و60 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 16 — Inventory & Warehouse Management Architecture

- [x] تحليل مواصفات الخطوة السادسة عشرة وتثبيت ملكية المخزون وحدود المستودعات لكل كيان.
- [x] إضافة المستودعات والمناطق والممرات والرفوف والخانات وحالات المواقع.
- [x] إضافة الأصناف والوحدات والباركود والدفعات والأرقام التسلسلية والصلاحية.
- [x] إضافة الأرصدة المتاحة والمحجوزة والمحجوبة والعابرة مع دفتر الحركة كمصدر الحقيقة.
- [x] إضافة الاستلام والحجز وبنية التحويل؛ الوضع والالتقاط والإصدار والمرتجعات مرحلة لاحقة.
- [x] إضافة الجرد الدوري والكامل والأعمى وبنود الفروقات؛ الاعتماد والترحيل مرحلة لاحقة.
- [x] إضافة المتوسط المرجح والتقييم؛ FIFO وSpecific Identification وCOGS والتقادم مرحلة لاحقة.
- [x] تطبيق عزل الكيان والمستودع وIdempotency ومنع المخزون السالب والتدقيق.
- [x] إضافة إجراءات محمية للاستعلام والاستلام والحجز؛ النقل والجرد والتسوية التشغيلية مرحلة لاحقة.
- [x] إضافة حدث StockReceived ونقاط Source System/ID/Correlation للتكامل مع الأنظمة الأخرى.
- [x] بناء لوحة عربية متجاوبة للأرصدة والقيمة والتوفر والحجز وسجل الأصناف.
- [x] إضافة اختبارات الاتساق والتوافر ومنع السالب والمتوسط المرجح وفروق الجرد.
- [x] تحديث التوثيق والتحقق من TypeScript و64 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.
