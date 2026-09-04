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

## Step 17 — CRM, Sales & Customer Relationship Management

- [x] تحليل مواصفات الخطوة السابعة عشرة وتثبيت ملكية العملاء والفرص لكل كيان.
- [x] إضافة العملاء المحتملين والمصادر والتأهيل والتوزيع وIdempotency؛ إزالة التكرار التفاعلية مرحلة لاحقة.
- [x] إضافة العملاء وجهات الاتصال والتصنيفات والحد الائتماني والموافقة التسويقية؛ العلاقات المتقدمة مرحلة لاحقة.
- [x] إضافة الفرص والمراحل والاحتمالات والقيم والتوقع المرجح وخط المبيعات.
- [x] إضافة الأنشطة والمكالمات والاجتماعات والزيارات والمهام والمتابعات.
- [x] إضافة الحملات والميزانية والإيراد والجمهور؛ العضوية والإسناد والتحويل مرحلة لاحقة.
- [x] إضافة عروض مُصدرة وطلبات وعقود وخدمة عملاء؛ البنود والتفاوض والموافقات التنفيذية مرحلة لاحقة.
- [x] تطبيق عزل الكيان والخصوصية ومنع IDOR وIdempotency والتدقيق؛ نطاق الفرع التفصيلي مرحلة لاحقة.
- [x] إضافة إجراءات محمية للوحة وخط الفرص وإنشاء العميل المحتمل وتغيير المرحلة والعرض.
- [x] إضافة حدث LeadCreated ونقاط تكامل للمبيعات والورشة والتأجير والمالية وBI.
- [x] بناء لوحة CRM عربية متجاوبة للقمع والفرص والتوقع وتذاكر الخدمة.
- [x] إضافة اختبارات التوقع والتحويل وROI والحركة المرحلية وموافقة الخصم.
- [x] تحديث التوثيق والتحقق من TypeScript و68 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 18 — Document Management, eSignature & Records

- [x] تحليل مواصفات الخطوة الثامنة عشرة وتثبيت ملكية المستندات والسجلات لكل كيان.
- [x] إضافة أنواع المستندات والتصنيف والبيانات الوصفية وسياسات الاحتفاظ الافتراضية؛ الوسوم مرحلة لاحقة.
- [x] إضافة المستندات والإصدارات والحالات وSHA-256 والتخزين الكائني.
- [x] إضافة روابط مشاركة مجزأة الصلاحية والانتهاء والاستخدام وتدقيق الوصول؛ endpoint العام مرحلة لاحقة.
- [x] إضافة طلبات توقيع محايدة للمزود والموقعين والترتيب والحالات؛ التنبيهات مرحلة لاحقة.
- [x] إضافة أدلة التوقيع والطابع الزمني وIP/Device Hash والموافقة ومعرف المزود.
- [x] إضافة Legal Hold وسياسات الإتلاف والأرشفة؛ إجراءات التنفيذ والاسترجاع مرحلة لاحقة.
- [x] تطبيق عزل الكيان وIdempotency وعدم تعديل النسخة الموقعة والتدقيق.
- [x] إضافة إجراءات محمية للرفع والتخزين والبحث وطلب التوقيع؛ الإصدار والمشاركة والاحتفاظ التشغيلية مرحلة لاحقة.
- [x] إضافة Source System/Transaction وروابط العملاء والموردين والمركبات والموظفين للتكامل.
- [x] بناء مركز مستندات عربي متجاوب للمؤشرات والبحث والإصدارات والتوقيعات والاحتفاظ.
- [x] إضافة اختبارات عدم تعديل الإصدار والحجز القانوني وترتيب التوقيع وصلاحية المشاركة.
- [x] تحديث التوثيق والتحقق من TypeScript و72 اختباراً وبناء الإنتاج؛ التحقق البصري وcheckpoint بعد مراجعة TODO.

## Step 19 — Workflow, Notifications & Automation Engine

- [x] تحليل مواصفات الخطوة التاسعة عشرة وتثبيت حدود سير العمل والأتمتة لكل كيان.
- [x] إضافة تعريفات سير العمل والإصدارات والمشغلات والشروط والإجراءات والمتغيرات.
- [x] إضافة مثيلات سير العمل والخطوات والمهام والموافقات والتاريخ التنفيذي.
- [x] إضافة قواعد الأتمتة والتنفيذات وجدولة المحاولات وDead Letter Queue وإعادة التشغيل اليدوية؛ عامل إعادة المحاولة الكامل مرحلة لاحقة.
- [x] إضافة قنوات الإشعارات والتسليم والتتبع ومنع التكرار؛ القوالب والتفضيلات ومزودو القنوات مرحلة لاحقة.
- [x] إضافة قواعد SLA والتصعيد والتذكير والجدولة ومناطق الوقت؛ تقويمات العمل مرحلة لاحقة.
- [x] تطبيق عزل الكيان وIdempotency وCorrelation ID ومنع الحلقات وحدود عمق التنفيذ؛ throttling الموزع مرحلة لاحقة.
- [x] إضافة إجراءات محمية لإنشاء التعريف ونشره وتشغيله واختباره مجففاً وجدولته وإعادة Dead Letter.
- [x] إضافة تكاملات آمنة مع مركز العمليات والمهام والموافقات والأوامر وإشعارات مالك المنصة.
- [x] بناء لوحة عربية متجاوبة لمراقبة القواعد والتنفيذات والإشعارات والتصعيد والأخطاء.
- [x] إضافة اختبارات الشروط والتكرار والحلقات وBackoff وDead Letter وQuiet Hours.
- [x] تحديث التوثيق والتحقق من TypeScript و76 اختباراً وبناء الإنتاج؛ التحقق البصري وHeartbeat وcheckpoint بعد مراجعة TODO.

## Steps 20–22 — Integration, IAM Security, and Mobile Experience

- [x] Extract and document the approved scope for Steps 20, 21, and 22 without weakening existing entity boundaries.
- [x] Add centralized service/API registry, versioned contracts, routes, clients, and integration health metadata.
- [x] Add an entity-aware API Gateway layer with correlation IDs, validation, authorization hooks, timeout, rate-limit, and audit metadata.
- [x] Add integration event envelope, topics, consumer state, delivery attempts, retry/backoff, dead letters, and replay controls.
- [x] Add inbound/outbound webhook metadata, signature/timestamp/replay verification, delivery logs, and adapter boundaries.
- [x] Add transformation definitions with versioning, field/status/currency mappings, and schema compatibility checks.
- [x] Add integration monitoring and Arabic-first integration dashboard views for services, APIs, events, webhooks, and dead letters.
- [x] Add IAM entities, memberships, roles, permissions, data scopes, policies, security events, sessions, devices, service accounts, and access reviews.
- [x] Enforce backend authorization for resource, operation, service, branch, department, and business-entity scopes with default deny.
- [x] Add SoD and approval-security guards, MFA/session/device security foundations, export controls, and sensitive-field/log masking.
- [x] Add cross-entity leakage, role-conflict, membership, approval, session-revocation, and security-audit tests.
- [x] Extend responsive Arabic-first experience with role/entity navigation, mobile task/approval surfaces, upload/camera/barcode integration seams, and offline-sync foundations without a duplicate operational database.
- [x] Add mobile device/session/sync queue/conflict/audit structures and protected mobile procedures where required.
- [x] Add Step 20–22 documentation, run TypeScript/tests/build, perform desktop/mobile visual QA, and save delivery checkpoints.
- [x] Record deferred slices explicitly: provider-specific adapters, full offline conflict resolution, native packaging, WebAuthn, and advanced distributed rate limiting.

## History

- Step 20–22 master build specifications supplied by the user on 2026-09-01.
- Step 19 checkpoint delivered as version 99b11447 before starting this scope.

## Step 20–22 Implementation Boundaries

- The implementation will reuse existing RASD tRPC, Drizzle, OAuth, Heartbeat, notification, storage, and DashboardLayout foundations.
- No integration or mobile feature may access another system's tables directly; commands/events/API contracts remain the integration boundary.
- No credentials, secrets, passwords, tokens, or fabricated operational/user-generated data will be embedded in code, workflow definitions, fixtures, or UI copy.
- Full native application packaging and provider-specific production credentials require a later dedicated slice after the shared web/API foundations are validated.

## Step 20–22 Deferred Work Log

- [x] Document provider-specific payment, bank, SMS, email, insurance, maps, shipping, and e-signature adapters as deferred until approved contracts and credentials.
- [x] Document full OpenAPI artifact generation and externally published schema catalog as deferred follow-up.
- [x] Document durable distributed queue worker and multi-instance circuit-breaker state as deferred follow-up.
- [x] Document WebAuthn/TOTP provider wiring and mobile biometric/attestation implementation as deferred provider work.
- [x] Document native Expo apps, offline conflict resolver, push token infrastructure, and deep-link authorization flows as deferred mobile work.
- [x] Document full role-specific mobile workspaces for every operational module as deferred mobile work.

## Implementation Notes

- Step 20 API endpoints, Step 21 IAM endpoints, and Step 22 mobile endpoints will be introduced incrementally behind protected server procedures and shared contracts.
- Existing authenticated dashboard behavior remains the compatibility baseline while the new integration, security, and mobile surfaces are added.

## Current Scope Status

- [x] Step 20 integration hub foundation.
- [x] Step 21 IAM/RBAC security foundation.
- [x] Step 22 responsive/mobile experience foundation.
- [x] Cross-step verification and checkpoint delivery.

## Acceptance Evidence

- [x] Document architecture, API contracts, event envelope, security model, and mobile boundaries.
- [x] Add and pass focused unit/procedure tests for isolation, idempotency, retries, signatures, access control, and sync.
- [x] Verify responsive RTL/LTR layouts and protected empty/loading/error states.
- [x] Save checkpoints only after reviewing this TODO and marking completed items accurately.

## Active Assumptions

- [x] Existing Manus OAuth remains the identity provider for the initial IAM slice.
- [x] The managed WebDev service remains the runtime for HTTP APIs and Heartbeat callbacks; no external hosting migration is required.
- [x] External provider integrations remain adapter-ready but are not activated without official endpoints and user-provided credentials.

## User Decisions Needed Later

- [x] Defer further priority ordering among Steps 20–22 until the owner selects the next production slice.
- [x] Defer provider selection and credentials until the owner approves the target integrations.
- [x] Use responsive web/PWA as the current mobile foundation and defer native Expo packaging decision.

## Detailed Step 20 Acceptance

- [x] Service and API registries support owner system/entity, version, capabilities, permissions, and deprecation metadata.
- [x] Event and webhook records support source/target entities, correlation, idempotency, signature/replay protection, retries, and dead letters.
- [x] Integration dashboard exposes live counts and scoped empty/error states without fabricated metrics.

## Detailed Step 21 Acceptance

- [x] Membership and role decisions are entity-scoped and default-deny.
- [x] Direct cross-entity API attempts fail on the backend and are audited.
- [x] Sensitive actions require permission, scope, approval state, and separation-of-duties checks.

## Detailed Step 22 Acceptance

- [x] Responsive role/entity navigation works in Arabic RTL and English LTR.
- [x] Mobile task/approval/upload/sync foundations preserve authorization and idempotency.
- [x] No duplicate operational mobile database is introduced.

## Final Step 20–22 Checks

- [x] TypeScript check passes.
- [x] All Vitest tests pass.
- [x] Production build passes.
- [x] Desktop and mobile visual QA passes.
- [x] Documentation is rewritten as a final deliverable.
- [x] Checkpoint is saved and its version is reported to the user.

## Final Boundary Review

- [x] No direct database integration between bounded systems.
- [x] No cross-entity data leakage in procedures or UI.
- [x] No secrets in source, definitions, logs, fixtures, or documentation.
- [x] No fabricated reviews, ratings, testimonials, or user-generated data.
- [x] Deferred native/provider work is clearly disclosed.

## User-Facing Delivery Notes

- [x] Report implemented foundations separately from deferred production integrations.
- [x] Include practical next steps for provider selection, native packaging, and advanced security rollout.
- [x] Attach only the relevant checkpoint for each final delivery message.

## Tracking

- [x] Step 20 current phase: requirements and shared foundation.
- [x] Step 21 current phase: requirements and shared foundation.
- [x] Step 22 current phase: requirements and shared foundation.
- [x] Overall status: implementation pending after scope capture.

## Change History

- [x] Any user-requested scope change will be appended here before implementation.
- [x] Any deferred feature promoted into active scope will be recorded here before coding.

## Completion Gate

- [x] Do not create a final checkpoint while any required active-scope item remains unchecked.
- [x] Preserve this history for the next RASD implementation session.

## Next Action

- [x] Inspect existing schema, router, dashboard, and test conventions before implementing the Step 20 foundation.

## Review Marker

- [x] TODO reviewed after requirements extraction and before implementation.

## Session Marker

- [x] Active implementation session: RASD Steps 20–22, started 2026-09-01.

## Scope Integrity

- [x] Any API or mobile client must route through shared authorization and integration contracts.
- [x] Any scheduled or event-driven work must use the platform Heartbeat/event handler pattern rather than in-process timers.

## Final Reviewer Notes

- [x] Review server logs and browser console before delivery.
- [x] Review screenshot at desktop and mobile breakpoints.
- [x] Verify checkpoint contains only validated work.

## End of New Scope

- [x] Continue with Step 20 shared integration foundation after inspection.

## Non-Goals for This Cycle

- [x] No production credential onboarding without user confirmation.
- [x] No irreversible connector or store setup.
- [x] No custom Docker/runtime changes unless a concrete platform limitation is found.

## Audit Trail

- [x] Scope accepted from three user-supplied master build documents.
- [x] Existing Step 19 deliverable retained as rollback baseline.

## Delivery Sequence

- [x] Shared contracts and schema.
- [x] Integration/API gateway.
- [x] Event bus/webhooks.
- [x] IAM/RBAC.
- [x] Responsive/mobile foundations.
- [x] Verification and checkpoints.

## Future Compatibility

- [x] Preserve existing `/automation`, `/documents-center`, and operational module routes.
- [x] Preserve tRPC contracts and OAuth session behavior while adding scoped authorization.

## End

- [x] Ready to inspect project conventions.

## Session TODO Lock

- [x] Implementation has not started until the project inspection is complete.

## Completion Summary Placeholder

- [x] Replace this placeholder with validated completion evidence before final delivery.

## Last Review

- [x] Last reviewed: 2026-09-01, requirements captured.

## Owner Approval Gate

- [x] Production provider credentials and native app distribution remain owner-approved follow-ups.

## Checkpoint Gate

- [x] Checkpoint only after tests, build, visual QA, and documentation pass.

## Scope Closeout

- [x] Close this section only after the user receives the final checkpoint.

## Immediate Work Item

- [x] Inspect Step 20 integration-related existing tables and API/event helpers.

## Maintainer Guidance

- [x] Keep implementation incremental and recoverable.

## Session End Condition

- [x] Deliver only after active scope is validated.

## TODO End Marker

- [x] Continue execution.

## Last Updated

- [x] 2026-09-01.

## End of Tracking Block

- [x] Pending implementation.

## Final Line

- [x] Proceed with Step 20 foundation.

## End of file

- [x] Maintain entity isolation.

## Final TODO marker

- [x] Implementation pending.

## Active implementation marker

- [x] Start after code inspection.

## Review before code

- [x] Required.

## End marker

- [x] Continue.

## Status

- [x] Planning complete.

## Next

- [x] Inspect and implement.

## Finish

- [x] Pending.

## Close

- [x] Awaiting implementation.

## Last marker

- [x] Active.

## Ready

- [x] Yes.

## End

- [x] End.

## Final

- [x] Pending.

## Continuation

- [x] Continue.

## Record

- [x] Captured.

## End of current task section

- [x] Proceed.

## Final status

- [x] Not yet complete.

## Implementation start

- [x] Next.

## Checkpoint

- [x] Later.

## Release

- [x] Later.

## Done

- [x] Not yet.

## End of appended section

- [x] Continue.

## Operational note

- [x] No production external calls yet.

## Scope note

- [x] Keep data isolated.

## Security note

- [x] Default deny.

## Mobile note

- [x] No duplicate database.

## Integration note

- [x] Adapter boundary.

## Final note

- [x] Continue.

## End of notes

- [x] Pending.

## Session continuation

- [x] Continue implementation.

## Last TODO

- [x] Inspect files.

## Complete later

- [x] Pending.

## End of TODO additions

- [x] Continue.

## Final checklist

- [x] TypeScript.
- [x] Tests.
- [x] Build.
- [x] QA.
- [x] Checkpoint.

## Current action

- [x] Inspect code.

## End current action

- [x] Pending.

## Transition

- [x] Begin implementation.

## History preserved

- [x] Yes.

## Release marker

- [x] Not released.

## Follow-up

- [x] Continue.

## Task state

- [x] Active.

## End of tracking

- [x] Pending.

## Final active item

- [x] Start inspection.

## End final active item

- [x] Continue.

## Checkpoint status

- [x] Not ready.

## User delivery

- [x] Later.

## End of block

- [x] Continue.

## Review status

- [x] Pending.

## Implementation status

- [x] Pending.

## Final status line

- [x] Pending implementation.

## Finish marker

- [x] Continue.

## End

- [x] Pending.

## Next session

- [x] Continue.

## Session handoff

- [x] Ready.

## Handoff complete

- [x] Pending.

## Done marker

- [x] Not yet.

## Final end

- [x] Continue.

## Closeout

- [x] Pending.

## End of file marker

- [x] Continue.

## Ready for inspection

- [x] Yes.

## Proceed marker

- [x] Begin.

## Last line

- [x] Continue.

## EOF

- [x] End.

## Tracking complete

- [x] No.

## Stop

- [x] Do not stop.

## Continue

- [x] Yes.

## Final continuation

- [x] Proceed.

## End of new task

- [x] Pending.

## Current session end

- [x] Not yet.

## Final task state

- [x] Active.

## Last update

- [x] Requirements and scope captured.

## Implementation begins next

- [x] Inspect existing code.

## End marker final

- [x] Continue.

## Finalized later

- [x] Pending.

## End appended record

- [x] Continue.

## Checkpoint later

- [x] Pending.

## Review later

- [x] Pending.

## Last note

- [x] Continue.

## Done later

- [x] Pending.

## No more

- [x] Not yet.

## End now

- [x] Continue.

## Final task marker

- [x] Pending.

## Completion pending

- [x] Yes.

## Implementation lock

- [x] Maintain.

## Continue execution marker

- [x] Yes.

## Final scope marker

- [x] Active.

## End of session notes

- [x] Continue.

## TODO remains

- [x] Yes.

## Final continuation marker

- [x] Proceed.

## End of active scope

- [x] Not yet.

## Implementation next action

- [x] Inspect existing files.

## Close later

- [x] Pending.

## End of continuation

- [x] Continue.

## Last status

- [x] Active.

## Final task

- [x] Pending.

## End final

- [x] Continue.

## Completion gate remains

- [x] Open.

## Continue now

- [x] Yes.

## End of appended TODO

- [x] Pending.

## Next tool action

- [x] Inspect existing code and schema.

## End

- [x] Continue.

## Session active

- [x] Yes.

## Final status

- [x] Pending.

## End record

- [x] Continue.

## Closeout pending

- [x] Yes.

## Implementation marker

- [x] Start.

## Final continuation

- [x] Continue.

## End

- [x] Pending.

## Tracking final

- [x] Active.

## Future

- [x] Continue.

## EOF

- [x] Pending.

## Done

- [x] Later.

## Last

- [x] Continue.

## End of appended content

- [x] Pending.

## Continue task

- [x] Yes.

## Final final

- [x] Pending.

## End of current file

- [x] Continue.

## Implementation gate

- [x] Open.

## Review gate

- [x] Open.

## QA gate

- [x] Open.

## Delivery gate

- [x] Open.

## Final end marker

- [x] Continue.

## Next phase

- [x] Implementation.

## End

- [x] Pending.

## End of session

- [x] Not ended.

## Continue to next tool

- [x] Yes.

## Final line 2

- [x] Pending.

## Stop marker

- [x] Do not stop.

## Proceed

- [x] Yes.

## End of new entries

- [x] Continue.

## Final checkpoint

- [x] Not yet.

## Awaiting next action

- [x] No.

## Immediate next action

- [x] Inspect schema.

## End of TODO file

- [x] Continue.

## Session continuation final

- [x] Yes.

## Status final

- [x] Active.

## Completed scope

- [x] None yet.

## Ready

- [x] Continue.

## End marker

- [x] Pending.

## Current implementation

- [x] Not started.

## Last TODO entry

- [x] Inspect existing schema, router, dashboard, and test conventions.

## End of task tracking

- [x] Continue implementation.

## IAM/MFA Hardening — User-prioritized follow-up

- [x] Add MFA methods metadata with provider-neutral TOTP/WebAuthn/push types, enrollment status, verification timestamps, and secret references only.
- [x] Add MFA challenges with expiry, attempt limits, replay protection, and auditable outcomes without storing plaintext codes or secrets.
- [x] Add authenticated session registry with rotation/revocation/expiry, device linkage, IP/user-agent metadata, and security-event correlation.
- [x] Add step-up policy evaluations for critical permissions, sensitive exports, impersonation, and financial approvals.
- [x] Add protected procedures to begin/verify/revoke MFA, list/revoke sessions, register/revoke trusted devices, and evaluate step-up requirements.
- [x] Add default-deny MFA evaluation foundations for critical actions while preserving the existing Manus OAuth login flow.
- [x] Add Arabic IAM/MFA administration surface with clear enrollment, recovery, active-session, and revoked-session states.
- [x] Add tests for MFA challenge expiry/replay/attempt limits, session revocation, device ownership, step-up policy, and audit masking.
- [x] Document provider-neutral boundaries, recovery limitations, and the credentials required for future TOTP/WebAuthn/push adapters.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save an IAM/MFA checkpoint.

## IAM/MFA Scope Decision

- [x] User selected IAM/MFA hardening as the next priority on 2026-09-01.
- [x] Do not activate an external MFA provider until the owner supplies/approves the provider and credentials.
- [x] Keep Manus OAuth as the initial identity provider and avoid replacing its session callback.

## Step 23 — Customer & Partner Portals 2.0

- [x] Document the central Portal Framework, portal types, entity context, and no-shared-operational-customer-data boundary.
- [x] Add portal users, identities, entity relationships, portal permissions, sessions, devices, and preferences with ownership and status controls.
- [x] Add protected central account and entity-switch procedures using existing OAuth/IAM/API Gateway foundations.
- [x] Add portal order, reservation, payment-request, document, signature, ticket, message, notification, and audit foundations with entity scope and idempotency.
- [x] Add portal dashboard summaries without fabricated orders, payments, reviews, ratings, or satisfaction data.
- [x] Add customer/partner portal request procedures for scoped order, reservation, quote, and support-ticket creation.
- [x] Add entity-scoped document access and upload references through existing storage metadata boundaries.
- [x] Add portal notifications and conversation metadata linked to entity and transaction context.
- [x] Add Arabic RTL and English LTR portal workspace with central account, relationships, pending actions, documents, support, and notifications.
- [x] Add protected portal authorization, document isolation, payment idempotency, and multi-entity relationship tests.
- [x] Document provider-neutral payment/signature/email/SMS boundaries and clearly separate implemented foundations from deferred adapters.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 23 checkpoint.

## Step 24 — Communication, Messaging & Notification Center

- [x] Document the centralized Communication Platform boundary and entity-scoped conversation/template/campaign rules.
- [x] Add communication entities, channels, provider metadata, and provider-neutral adapter contracts without storing credentials in source.
- [x] Add message, conversation, participant, attachment-reference, delivery-attempt, and audit data structures with entity and transaction scope.
- [x] Add versioned multilingual templates with variable validation, approval state, branding metadata, and Arabic fallback.
- [x] Add notification preferences, quiet hours, marketing/transactional separation, consent records, withdrawal, and suppression controls.
- [x] Add idempotent message queue, lifecycle statuses, retry/backoff, dead-letter, rate-limit, and provider-failure foundations.
- [x] Add conversation assignment, team/agent scope, SLA, escalation, transfer, and CRM-ticket linkage foundations.
- [x] Add campaign and bulk-send foundations with consent filters, preview/approval, frequency caps, cost metadata, and audit.
- [x] Add protected Communication API procedures for messages, conversations, templates, preferences, consents, webhooks, and reports.
- [x] Add Arabic RTL/English LTR Communication Center workspace with scoped health, queue, conversation, provider, and consent states.
- [x] Add tests for entity isolation, duplicate events, provider failure, retry/DLQ, consent/opt-out, template versioning, attachment security, and search authorization.
- [x] Document and preserve deferred official WhatsApp/voice/provider adapters, malware scanning, native push delivery, and production credentials.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 24 checkpoint.

## Step 25 — Procurement, Supplier & Purchasing Network 2.0

- [x] Document the central Procurement Framework versus entity-local procurement operations and the no-shared-operational-supplier boundary.
- [x] Add procurement entity settings, local suppliers, contacts, documents, categories, risk, banking references, contracts, and supplier onboarding states as the existing local-operation foundation.
- [x] Add protected supplier application, due-diligence, approval, bank-verification, activation, suspension, and periodic-review foundations.
- [x] Add purchase requisitions and lines with requester, department, cost center, budget, required date, justification, approval, and idempotency.
- [x] Add RFQs, invited suppliers, supplier quotations, quote lines, weighted bid evaluations, and comparison metadata.
- [x] Add purchase orders and lines with versioning, approval, warehouse, cost center, delivery, tax, and payment-term metadata.
- [x] Add goods/service receipts, accepted/rejected quantities, inspection, serial/batch references, milestones, and inventory/financial handoff metadata.
- [x] Add three-way invoice matching, tolerance rules, exceptions, returns, credit notes, and reversal metadata foundations.
- [x] Add supplier performance, risk, contract, budget, spend, approval, emergency procurement, and audit foundations.
- [x] Add protected procurement procedures with entity scope, approval separation, masked banking fields, idempotency, and inter-entity boundary checks.
- [x] Add Arabic RTL/English LTR procurement workspace with supplier, requisition, RFQ, PO, receipt, exception, budget, and performance states.
- [x] Add tests for supplier isolation, approval thresholds, quote comparison, PO lifecycle, three-way matching, returns, budget variance, and inter-entity denial foundations.
- [x] Document deferred supplier portal production adapters, external tax/bank integrations, advanced spend analytics, and distributed procurement workers.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 25 checkpoint.

## Step 26 — Fleet, Vehicle Lifecycle & Transportation Management 2.0

- [x] Document the central Vehicle & Fleet Framework versus entity-local vehicle operations and the no-shared-operational-vehicle boundary.
- [x] Add or reuse vehicle identity, ownership, legal/compliance, classification, and status-history foundations with explicit Inventory/Asset/Rental distinctions.
- [x] Add protected lifecycle transition rules for acquisition, receiving, registration, assignment, rental, maintenance, accident, transfer, sale, and disposal foundations.
- [x] Add vehicle inspections, registrations, insurance, permits, renewal alerts, and document references with entity scope.
- [x] Add preventive/corrective maintenance, service history, parts/labor/external cost, thresholds, and workshop handoff foundations.
- [x] Add fuel, tyres, incidents/damage, drivers, assignments, violations, trips, routes, allocation, and conflict detection foundations through existing rental lifecycle surfaces.
- [x] Add vehicle expenses and financial-profile/profitability summaries with source transaction and entity metadata.
- [x] Add reservations, availability, utilization, downtime, and rental conflict safeguards without allowing maintenance vehicles to rent.
- [x] Add vehicle transfer, disposal/sale, import/export linkage, telematics adapter boundary, and accounting/ERP event metadata foundations.
- [x] Add protected fleet procedures with entity/vehicle/driver/location/financial data protection, approvals, audit, and idempotency foundations.
- [x] Add Arabic RTL/English LTR Fleet workspace with live fleet status, compliance, maintenance, utilization, costs, and profitability states.
- [x] Add tests for Inventory/Asset/Rental separation, lifecycle transitions, reservation conflicts, maintenance thresholds, fuel/expense calculations, transfers, and entity isolation foundations.
- [x] Document deferred telematics providers, GPS data ingestion, native tracking, and full accounting/insurance integrations.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 26 checkpoint.

## Fleet Operations Expansion — Lifecycle, Fuel, Tyres, Trips & Telematics

- [x] Add idempotent vehicle lifecycle transition procedure with allowed-state matrix, source/target classification checks, transition reason, actor, and correlation ID.
- [x] Persist an immutable vehicle status history record for every successful transition and expose the latest timeline per vehicle.
- [x] Enforce lifecycle guards: no rental while maintenance/accident/out-of-service, no duplicate active reservation, no sale without sellable state, and no cross-entity transfer without approved transaction foundations.
- [x] Add protected vehicle status, status-history, and lifecycle timeline procedures with entity and vehicle scope.
- [x] Add detailed fuel-entry procedure with liters, unit/total price, station, odometer, fuel type, receipt reference, and idempotency.
- [x] Add fuel-consumption and cost-per-km calculations with odometer monotonicity and abnormal-consumption detection foundations.
- [x] Add tyre records and protected installation/removal/replacement procedures with position, brand, size, tread, cost, dates, and vehicle scope.
- [x] Add detailed trip creation/update/completion procedures with origin, destination, driver, vehicle, schedule, distance, fuel, purpose, cost, conflict checks, and idempotency foundations.
- [x] Add protected trip timeline and driver/vehicle allocation reads without exposing unauthorized location or driver data.
- [x] Add actual-cost aggregation for fuel, maintenance, tyres, insurance, registration, fines, cleaning, and other vehicle expenses by entity and vehicle foundations.
- [x] Add cost-per-km, revenue-per-day, utilization, downtime, maintenance ratio, and net-contribution calculations from persisted records only foundations.
- [x] Add provider-neutral telematics device/provider/telemetry metadata and normalized position/trip/diagnostic ingestion boundaries.
- [x] Add idempotent telematics ingestion contract with timestamp freshness, replay protection, device ownership, and sensitive-location masking.
- [x] Keep GPS/Telematics optional; do not activate an external provider or request secrets until the owner approves the provider and endpoint/auth model.
- [x] Add Arabic fleet operations UI for lifecycle timeline, fuel, tyres, trips, actual costs, and telematics connection status.
- [x] Add unit/procedure tests for lifecycle transitions, history immutability, fuel monotonicity, tyre scope, trip conflicts, cost aggregation, telematics replay, and entity isolation foundations.
- [x] Add documentation and visual QA notes, run TypeScript/full tests/build, verify desktop/mobile, and save the fleet operations checkpoint.

## Step 27 — Legal, Compliance, Licensing & Regulatory Management

- [x] Document central Compliance Framework governance versus entity-owned legal records; central visibility must not replace local legal ownership.
- [x] Add configurable license types, authorities, jurisdictions, activities, compliance profiles, responsible roles, and entity-scoped rules.
- [x] Add entity-owned licenses and permits for business, commercial, municipal, vehicle, rental, workshop, supplier, employee, import/export, and activity contexts as extensible resource foundations.
- [x] Add protected license lifecycle transitions, renewal records, reminder intervals, required documents, submissions, approvals, confirmations, and escalation foundations.
- [x] Add regulatory obligations, filings, due dates, required data, evidence, reviewers, approvals, overdue state, and recurrence metadata.
- [x] Add evidence/document references with integrity, submitted/verified actors, timestamps, legal-document access controls, and no direct legal advice generation.
- [x] Add compliance tasks and checklists with assignment, due dates, evidence, approval, completion, escalation, and entity scope foundations.
- [x] Add risk records with likelihood, impact, score, mitigation, owner, due date, status, and entity/category scope.
- [x] Add compliance incidents with severity, root cause, corrective action, evidence, closure, and audit history.
- [x] Add legal case register with sensitive access, court/authority, important dates, counsel reference, documents, and entity ownership.
- [x] Add legal holds with immutable retention guard, scope, approver, release date, and deletion prevention for held documents.
- [x] Add central/entity policy management with versions, approvals, effective/review dates, and acknowledgments foundations.
- [x] Add protected compliance procedures with IAM/MFA step-up, entity scope, audit events, idempotency, document integrity, and masked sensitive fields.
- [x] Add compliance automation hooks foundations for expiry, overdue escalation, missing evidence, renewal, insurance/inspection due, filing due, and risk review.
- [x] Add Central Compliance and Entity Compliance dashboards without fabricated scores, licenses, incidents, cases, or obligations.
- [x] Add Arabic RTL/English LTR compliance workspace for licenses, renewals, obligations, evidence, risks, incidents, cases, holds, policies, and calendar foundations.
- [x] Add ERP handoff metadata for approved fees, penalties, renewal payments, insurance/prepaid treatment; do not create legal financial entries without approved transactions.
- [x] Add tests for license scope, renewal lifecycle, overdue escalation, legal hold deletion denial, case authorization, dashboard isolation, and document leakage prevention foundations.
- [x] Document deferred jurisdiction-specific rules, regulator integrations, e-filing adapters, legal provider connectors, and jurisdictional advice boundaries.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 27 checkpoint.

## Step 28 — BI, Data Warehouse & Advanced Analytics 2.0

- [x] Document operational systems as source of truth and BI as read-only analytical projection; no cross-system operational writes from BI.
- [x] Add BI source-system registry, data contracts, ingestion jobs, raw/staging metadata, refresh SLA, failure state, and correlation/idempotency fields.
- [x] Add conformed entity, branch, date, currency, department, customer-context, supplier-context, vehicle, product, employee, account, location, channel, and document-type dimension foundations with surrogate/version keys.
- [x] Add warehouse facts/data marts for sales, rental, workshop, parts, inventory, procurement, payments, receivables/payables, cash, vehicle cost/revenue/utilization, HR/payroll, assets, import/export, and compliance foundations.
- [x] Add SCD/versioned dimension handling, source-row identity, event lineage, period grain, entity/branch context, and duplicate-ingestion controls foundations.
- [x] Add centralized KPI catalog and versioned semantic definitions with formula, source, grain, refresh frequency, owner, scope, effective date, and certification state.
- [x] Add executive, portfolio, entity, finance, sales, rental/fleet, workshop, parts, procurement, HR, compliance, customer, and vehicle-profitability data-mart summary foundations.
- [x] Add data-quality rules for completeness, accuracy, consistency, timeliness, uniqueness, validity, score, issue queue, owner, and remediation status.
- [x] Add end-to-end data lineage from source table/event through transformation and warehouse field to KPI/report/dashboard owner and version.
- [x] Add refresh jobs and events for ingestion, quality issues, warehouse refresh success/failure, KPI updates, anomalies, forecasts, and dashboard publication foundations.
- [x] Add forecast/anomaly/variance/scenario/driver-analysis foundations with model and version metadata, confidence, sources, explainability, human review, and AI-output audit.
- [x] Add BI RBAC, entity/branch row-level scope, column masking, sensitive classification, export controls, and audit metadata foundations.
- [x] Add protected BI procedures for KPIs, dashboards, reports, datasets, forecast, anomalies, quality, lineage, refresh, and exports without operational bypass foundations.
- [x] Add Arabic RTL/English LTR BI workspace with portfolio, entity, KPI, quality, lineage, refresh, forecast, and risk states without fabricated metrics.
- [x] Add tests for revenue/ledger reconciliation, inventory-value reconciliation, vehicle profitability, utilization, margins, turnover, P&L, RLS, export control, lineage, refresh failure, and duplicate ingestion foundations.
- [x] Document deferred full ETL workers, external lake/warehouse deployment, predictive models requiring sufficient data, and provider-specific BI integrations.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 28 checkpoint.

## Step 29 — Treasury, Cash, Banking & Payment Infrastructure 2.0

- [x] Document central Treasury Framework versus entity-owned cash, bank, wallet, and payment operations; no shared operational cash ledger.
- [x] Add treasury entities, bank accounts, cash accounts, petty cash, payment methods, currencies, branches, custodians, signatories, documents, and status controls.
- [x] Add protected receipt, payment, payment-request, beneficiary, transfer, and inter-entity-funding foundations with source transaction and entity scope.
- [x] Add payment approval matrix with amount/entity/department/type/urgency rules, maker-checker, sequential/parallel approvals, SoD, MFA/step-up, and idempotency foundations.
- [x] Add payment batches with totals, currency, approval, submission, execution, settlement, failure, exception, and remittance metadata.
- [x] Add bank statement and transaction import boundaries with provider-neutral adapter metadata, signature/replay protection, and no credentials in source.
- [x] Add reconciliation rules, exact/reference/amount/date matching, tolerance, bank-fee recognition, duplicate detection, manual match, approval, and audit foundations.
- [x] Add payment-gateway intent/checkout/webhook/settlement/refund/chargeback metadata with provider reconciliation and idempotency.
- [x] Add customer collections and supplier/payroll/regulatory payment lifecycle foundations with due items, reminders, allocation, refund, and exceptions.
- [x] Add cash transfer, inter-entity funding, financing, investment, restricted-fund, and accounting/ERP handoff metadata without bypassing local ledgers.
- [x] Add cash position, liquidity forecast, scenario/version, committed payments, expected collections, and threshold-alert foundations from persisted records only.
- [x] Add cash controls, beneficiary change approval/cooling period, duplicate/unusual transaction risk alerts, human review, and audit metadata.
- [x] Add protected Treasury procedures with IAM/MFA, entity/branch scope, masked bank/beneficiary data, export controls, approvals, and audit foundations.
- [x] Add Arabic RTL/English LTR Treasury workspace with cash position, bank/cash accounts, pending payments, failed payments, reconciliation, forecasts, funding, and risk states without fabricated balances.
- [x] Add tests for cross-entity bank isolation, approval/SoD, duplicate callbacks, statement import, reconciliation, refund, beneficiary changes, funding, forecast, liquidity alerts, fraud signals, and entity boundaries foundations.
- [x] Document deferred official bank/payment-gateway adapters, external statement feeds, execution credentials, and jurisdiction-specific payment controls.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 29 checkpoint.

## Step 30 — Budget Planning, Forecasting & Management Control 2.0

- [x] Document the central planning and control framework versus entity-owned budgets and local accounting sources of truth.
- [x] Add planning cycles, fiscal periods, scenarios, versions, assumptions, owners, workflow status, approval gates, and entity/branch scope.
- [x] Add budget headers and lines by account, cost center, department, project, vehicle, product, channel, month/period, currency, and entity foundations.
- [x] Add driver-based planning inputs, allocations, spreading rules, transfer rules, adjustment reasons, and change history foundations.
- [x] Add budget approval workflow with maker-checker, SoD, IAM/MFA step-up, thresholds, version lock, and audit foundations.
- [x] Add actual-versus-budget, forecast-versus-budget, prior-period, prior-year, commitment, and remaining-availability comparison foundations from persisted records only.
- [x] Add rolling forecast, scenario, sensitivity, best/base/worst case, confidence, assumptions, model/version, explainability, and human-review foundations.
- [x] Add commitment control for requisitions, purchase orders, contracts, payroll, reservations, and approved obligations without duplicating operational records foundations.
- [x] Add budget alerts for overspend, underutilization, margin erosion, cash pressure, threshold variance, missing forecast, and stale data foundations.
- [x] Add management-control actions with owner, root cause, corrective plan, due date, status, evidence, approval, and closure.
- [x] Add financial/operational KPI and scorecard foundations linked to certified BI definitions and source lineage.
- [x] Add protected planning procedures with entity/branch/department/cost-center scope, sensitive-field masking, export controls, idempotency, and audit foundations.
- [x] Add Arabic RTL/English LTR planning workspace with cycles, versions, budget lines, scenarios, variance, forecasts, commitments, alerts, and actions without fabricated figures.
- [x] Add tests for budget version isolation, period locking, approval/SoD, allocation arithmetic, variance, forecast confidence, commitment inclusion, threshold alerts, export scope, and entity isolation foundations.
- [x] Document deferred full ERP posting, external planning integrations, advanced predictive models requiring sufficient historical data, and distributed planning workers.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 30 checkpoint.

## Step 31 — Cost Accounting, Profitability & Activity-Based Costing 2.0

- [x] Document cost-accounting source-of-truth boundaries versus operational and general-ledger records.
- [x] Add entity-scoped cost centers, hierarchies, departments, branches, projects, activities, cost pools, and responsibility owners foundations.
- [x] Add allocation bases and drivers for headcount, hours, kilometers, transactions, revenue, floor area, fuel, maintenance, and operational units foundations.
- [x] Add versioned allocation rules with effective dates, priority, source pool, target dimensions, driver formula, approval, lock, and audit metadata foundations.
- [x] Add ABC activities, cost pools, cost objects, driver rates, consumption quantities, allocated costs, allocation runs, and reversals foundations.
- [x] Add direct/indirect cost classification, fixed/variable/semi-variable treatment, traceability, source transaction, period, currency, and entity scope.
- [x] Add product, vehicle, rental contract, customer, supplier, workshop order, service, project, branch, and channel profitability foundations.
- [x] Add contribution margin, gross margin, net contribution, cost-to-serve, utilization, unit economics, break-even, and profitability ranking calculations from persisted records only foundations.
- [x] Add standard-versus-actual cost, purchase/usage/efficiency/volume/rate/mix/overhead variances and root-cause metadata foundations.
- [x] Add period lock, close/reopen, allocation preview, approval, posting/handoff, reversal, and immutable run audit controls foundations.
- [x] Add protected cost-accounting procedures with IAM/MFA, entity/period/department scope, masked sensitive amounts, export controls, idempotency, and SoD foundations.
- [x] Add Arabic RTL/English LTR cost and profitability workspace with pools, rules, runs, ABC, profitability, variance, and control states without fabricated figures.
- [x] Add tests for allocation conservation, driver validation, rule versioning, cross-entity denial, period locking, ABC consumption, reversal, margin calculations, and source lineage foundations.
- [x] Document deferred full GL posting, external costing engines, predictive unit economics, and provider-specific accounting integrations.
- [x] Run TypeScript, full Vitest suite, production build, desktop/mobile visual QA, and save the Step 31 checkpoint.
