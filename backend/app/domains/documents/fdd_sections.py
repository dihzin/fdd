from app.domains.documents.schemas import FddBaseSectionDefinition

DEFAULT_FDD_SECTIONS: list[FddBaseSectionDefinition] = [
    FddBaseSectionDefinition(section_key="objective_scope", section_title="1. Objective and Scope", section_order=1),
    FddBaseSectionDefinition(section_key="business_process", section_title="2. Business Process Overview", section_order=2),
    FddBaseSectionDefinition(section_key="requirements_coverage", section_title="3. Requirements Coverage", section_order=3),
    FddBaseSectionDefinition(section_key="functional_design", section_title="4. Functional Design", section_order=4),
    FddBaseSectionDefinition(section_key="interfaces_data", section_title="5. Interfaces and Data Design", section_order=5),
    FddBaseSectionDefinition(section_key="security_controls", section_title="6. Security and Controls", section_order=6),
    FddBaseSectionDefinition(section_key="assumptions_dependencies", section_title="7. Assumptions and Dependencies", section_order=7),
    FddBaseSectionDefinition(section_key="test_considerations", section_title="8. Test Considerations", section_order=8),
]
