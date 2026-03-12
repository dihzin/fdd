"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { MetricTile } from "@/components/ui/metric-tile";
import { SectionCard } from "@/components/ui/section-card";
import { fetchSolution, fetchSolutionWizard, saveSolutionWizard } from "@/modules/solutions/api";
import type {
  SolutionWizardContext,
  SolutionWizardStepKey,
  WizardBusinessRuleItem,
  WizardIntegrationItem,
  WizardNarrativeBlock,
  WizardTechnicalImpactItem,
} from "@/modules/solutions/types";

const wizardSteps: Array<{
  key: SolutionWizardStepKey;
  label: string;
  caption: string;
}> = [
  { key: "context", label: "Contexto", caption: "Business and scope framing" },
  { key: "businessProblem", label: "Problema de negocio", caption: "Why the solution exists" },
  { key: "currentProcess", label: "Processo atual", caption: "Current-state flow and friction" },
  { key: "futureProcess", label: "Processo futuro", caption: "Target-state operating model" },
  { key: "integrations", label: "Integracoes", caption: "Systems and touchpoints" },
  { key: "businessRules", label: "Regras de negocio", caption: "Decision and compliance logic" },
  { key: "technicalImpacts", label: "Impactos tecnicos", caption: "Architecture and delivery impacts" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export function SolutionWizard({ solutionId }: { solutionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const defaultStep = isStepKey(stepParam) ? stepParam : "context";

  const [activeStep, setActiveStep] = useState<SolutionWizardStepKey>(defaultStep);
  const [draft, setDraft] = useState<SolutionWizardContext | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initializedStepRef = useRef<string>("");
  const lastSavedRef = useRef<string>("");

  const solutionQuery = useQuery({
    queryKey: ["solution", solutionId],
    queryFn: () => fetchSolution(solutionId),
  });

  const wizardQuery = useQuery({
    queryKey: ["solution-wizard", solutionId],
    queryFn: () => fetchSolutionWizard(solutionId),
  });

  const saveMutation = useMutation({
    mutationFn: saveSolutionWizard,
    onSuccess: (payload) => {
      lastSavedRef.current = JSON.stringify(payload.wizardContext);
      setSaveState("saved");
      setSaveError(null);
    },
    onError: (error) => {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Unable to save wizard draft.");
    },
  });

  useEffect(() => {
    if (!wizardQuery.data || initializedStepRef.current === solutionId) {
      return;
    }

    setDraft(wizardQuery.data.wizardContext);
    setSaveState("idle");
    setValidationErrors([]);
    setSaveError(null);
    lastSavedRef.current = JSON.stringify(wizardQuery.data.wizardContext);
    initializedStepRef.current = solutionId;
  }, [solutionId, wizardQuery.data]);

  useEffect(() => {
    if (!isStepKey(stepParam) || stepParam === activeStep) {
      return;
    }

    setActiveStep(stepParam);
  }, [activeStep, stepParam]);

  const stepIndex = wizardSteps.findIndex((step) => step.key === activeStep);
  const currentStepMeta = wizardSteps[stepIndex];
  useEffect(() => {
    if (!draft) {
      return;
    }

    const serializedDraft = JSON.stringify(draft);
    if (serializedDraft === lastSavedRef.current) {
      return;
    }

    const errors = validateStep(activeStep, draft);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setSaveState("saving");
    const timeoutId = window.setTimeout(() => {
      void saveMutation.mutateAsync({
        solutionId,
        wizardContext: draft,
      });
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeStep, draft, saveMutation, solutionId]);

  const completion = useMemo(() => {
    if (!draft) {
      return 0;
    }

    return wizardSteps.filter((step) => validateStep(step.key, draft).length === 0 && hasStepContent(step.key, draft)).length;
  }, [draft]);

  const navigateToStep = async (nextStep: SolutionWizardStepKey) => {
    if (!draft) {
      return;
    }

    const errors = validateStep(activeStep, draft);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (JSON.stringify(draft) !== lastSavedRef.current) {
      try {
        setSaveState("saving");
        await saveMutation.mutateAsync({ solutionId, wizardContext: draft });
      } catch {
        return;
      }
    }

    setValidationErrors([]);
    setActiveStep(nextStep);
    router.replace(`/solutions/${solutionId}/wizard?step=${nextStep}`);
  };

  const updateNarrativeStep = (step: Extract<SolutionWizardStepKey, "context" | "businessProblem" | "currentProcess" | "futureProcess">, value: WizardNarrativeBlock) => {
    setDraft((current) => (current ? { ...current, [step]: value } : current));
    setSaveState("idle");
  };

  const updateIntegration = (index: number, field: keyof WizardIntegrationItem, value: string) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const nextItems = current.integrations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      );

      return { ...current, integrations: nextItems };
    });
    setSaveState("idle");
  };

  const updateBusinessRule = (index: number, field: keyof WizardBusinessRuleItem, value: string) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const nextItems = current.businessRules.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      );

      return { ...current, businessRules: nextItems };
    });
    setSaveState("idle");
  };

  const updateTechnicalImpact = (index: number, field: keyof WizardTechnicalImpactItem, value: string) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const nextItems = current.technicalImpacts.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      );

      return { ...current, technicalImpacts: nextItems };
    });
    setSaveState("idle");
  };

  const activeSolution = solutionQuery.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard
          title="Solution wizard"
          description="Structured capture flow for the context that will feed FDD generation and section-level AI later."
        >
          <div className="rounded-[1.85rem] bg-[linear-gradient(135deg,#0b1220_0%,#11283c_45%,#115e59_100%)] p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Active solution</p>
                <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold">
                  {activeSolution?.name ?? "Loading solution"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                  Progressively capture business narrative, process framing and technical constraints without collapsing the
                  whole solution definition into a single form.
                </p>
              </div>
              <Link
                href="/solutions"
                className="rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to solutions
              </Link>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <MetricTile label="Steps ready" value={`${completion}/${wizardSteps.length}`} tone="accent" />
              <MetricTile label="Linked reqs" value={`${activeSolution?.requirementCount ?? 0}`} />
              <MetricTile label="Autosave" value={saveLabel(saveState)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Flow guidance"
          description="Each step has a clear decision purpose and can be saved independently."
        >
          <div className="grid gap-3">
            {wizardSteps.map((step, index) => {
              const isActive = step.key === activeStep;
              const isComplete = draft ? validateStep(step.key, draft).length === 0 && hasStepContent(step.key, draft) : false;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => void navigateToStep(step.key)}
                  className={`flex items-center justify-between rounded-[1.35rem] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-[var(--border)] bg-white text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-semibold ${
                        isActive ? "bg-white/12 text-white" : isComplete ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-900"}`}>{step.label}</p>
                      <p className={`mt-1 text-sm ${isActive ? "text-slate-300" : "text-slate-500"}`}>{step.caption}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-white/12 text-white" : isComplete ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    {isComplete ? "Ready" : "Pending"}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.84fr_1.16fr]">
        <SectionCard
          title="Step status"
          description="Validation, autosave and context signals for the currently selected step."
        >
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-slate-50 px-5 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current step</p>
              <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-slate-900">
                {currentStepMeta.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{currentStepMeta.caption}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Autosave" value={saveLabel(saveState)} tone={saveState === "error" ? "danger" : "default"} />
              <MiniMetric label="Updated" value={formatUpdatedAt(saveMutation.data?.updatedAt ?? wizardQuery.data?.updatedAt)} />
            </div>

            {validationErrors.length ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-5">
                <p className="text-sm font-semibold text-rose-900">Step validation</p>
                <div className="mt-3 space-y-2">
                  {validationErrors.map((error) => (
                    <p key={error} className="text-sm text-rose-700">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-5">
                <p className="text-sm font-semibold text-emerald-900">Step validation</p>
                <p className="mt-2 text-sm text-emerald-700">Current step is structurally valid for autosave and downstream FDD use.</p>
              </div>
            )}

            {saveError ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-5">
                <p className="text-sm font-semibold text-rose-900">Save error</p>
                <p className="mt-2 text-sm text-rose-700">{saveError}</p>
              </div>
            ) : null}

            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef6f7_100%)] px-5 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">FDD readiness</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This wizard captures the structured narrative that later feeds section generation, especially objective, process,
                assumptions and technical impacts.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={currentStepMeta.label}
          description="One step at a time, with scoped inputs and explicit ownership of what gets persisted."
        >
          {!draft || wizardQuery.isLoading || solutionQuery.isLoading ? (
            <StatePanel title="Loading wizard" description="Fetching solution context and previously saved draft." />
          ) : (
            <div className="space-y-6">
              {renderStep({
                activeStep,
                draft,
                onNarrativeChange: updateNarrativeStep,
                onIntegrationChange: updateIntegration,
                onBusinessRuleChange: updateBusinessRule,
                onTechnicalImpactChange: updateTechnicalImpact,
                setDraft,
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
                <button
                  type="button"
                  onClick={() => void navigateToStep(wizardSteps[Math.max(stepIndex - 1, 0)].key)}
                  disabled={stepIndex === 0}
                  className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous step
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    Step {stepIndex + 1} of {wizardSteps.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => void navigateToStep(wizardSteps[Math.min(stepIndex + 1, wizardSteps.length - 1)].key)}
                    disabled={stepIndex === wizardSteps.length - 1}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next step
                  </button>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
}

function renderStep({
  activeStep,
  draft,
  onNarrativeChange,
  onIntegrationChange,
  onBusinessRuleChange,
  onTechnicalImpactChange,
  setDraft,
}: {
  activeStep: SolutionWizardStepKey;
  draft: SolutionWizardContext;
  onNarrativeChange: (
    step: Extract<SolutionWizardStepKey, "context" | "businessProblem" | "currentProcess" | "futureProcess">,
    value: WizardNarrativeBlock,
  ) => void;
  onIntegrationChange: (index: number, field: keyof WizardIntegrationItem, value: string) => void;
  onBusinessRuleChange: (index: number, field: keyof WizardBusinessRuleItem, value: string) => void;
  onTechnicalImpactChange: (index: number, field: keyof WizardTechnicalImpactItem, value: string) => void;
  setDraft: Dispatch<SetStateAction<SolutionWizardContext | null>>;
}) {
  if (activeStep === "context" || activeStep === "businessProblem" || activeStep === "currentProcess" || activeStep === "futureProcess") {
    const block = draft[activeStep];
    return (
      <NarrativeStepEditor
        value={block}
        onChange={(value) => onNarrativeChange(activeStep, value)}
      />
    );
  }

  if (activeStep === "integrations") {
    return (
      <CollectionEditor
        title="Integrations"
        description="Capture only the integration touchpoints that materially affect the solution design."
        onAdd={() =>
          setDraft((current) =>
            current
              ? {
                  ...current,
                  integrations: [
                    ...current.integrations,
                    { name: "", sourceSystem: "", targetSystem: "", description: "" },
                  ],
                }
              : current,
          )
        }
      >
        {draft.integrations.length === 0 ? (
          <EmptyCollectionMessage message="No integrations added yet." />
        ) : (
          draft.integrations.map((item, index) => (
            <CollectionCard
              key={`${item.name}-${index}`}
              onRemove={() =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        integrations: current.integrations.filter((_, currentIndex) => currentIndex !== index),
                      }
                    : current,
                )
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Name" value={item.name} onChange={(value) => onIntegrationChange(index, "name", value)} placeholder="Fiscal engine" />
                <InputField label="Source system" value={item.sourceSystem} onChange={(value) => onIntegrationChange(index, "sourceSystem", value)} placeholder="SAP S/4" />
                <InputField label="Target system" value={item.targetSystem} onChange={(value) => onIntegrationChange(index, "targetSystem", value)} placeholder="External platform" />
                <TextAreaField label="Description" value={item.description} onChange={(value) => onIntegrationChange(index, "description", value)} placeholder="Describe payload, trigger and purpose." rows={4} />
              </div>
            </CollectionCard>
          ))
        )}
      </CollectionEditor>
    );
  }

  if (activeStep === "businessRules") {
    return (
      <CollectionEditor
        title="Business rules"
        description="Document only the decision logic that affects process flow, validations or exception handling."
        onAdd={() =>
          setDraft((current) =>
            current
              ? {
                  ...current,
                  businessRules: [
                    ...current.businessRules,
                    { title: "", description: "", criticality: "" },
                  ],
                }
              : current,
          )
        }
      >
        {draft.businessRules.length === 0 ? (
          <EmptyCollectionMessage message="No business rules added yet." />
        ) : (
          draft.businessRules.map((item, index) => (
            <CollectionCard
              key={`${item.title}-${index}`}
              onRemove={() =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        businessRules: current.businessRules.filter((_, currentIndex) => currentIndex !== index),
                      }
                    : current,
                )
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Title" value={item.title} onChange={(value) => onBusinessRuleChange(index, "title", value)} placeholder="Approval threshold" />
                <InputField label="Criticality" value={item.criticality} onChange={(value) => onBusinessRuleChange(index, "criticality", value)} placeholder="High" />
                <div className="md:col-span-2">
                  <TextAreaField label="Description" value={item.description} onChange={(value) => onBusinessRuleChange(index, "description", value)} placeholder="Describe the decision rule and effect on the process." rows={4} />
                </div>
              </div>
            </CollectionCard>
          ))
        )}
      </CollectionEditor>
    );
  }

  return (
    <CollectionEditor
      title="Technical impacts"
      description="Capture the technical implications that matter for architecture, delivery planning and controls."
      onAdd={() =>
        setDraft((current) =>
          current
            ? {
                ...current,
                technicalImpacts: [
                  ...current.technicalImpacts,
                  { area: "", impact: "", owner: "" },
                ],
              }
            : current,
        )
      }
    >
      {draft.technicalImpacts.length === 0 ? (
        <EmptyCollectionMessage message="No technical impacts added yet." />
      ) : (
        draft.technicalImpacts.map((item, index) => (
          <CollectionCard
            key={`${item.area}-${index}`}
            onRemove={() =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      technicalImpacts: current.technicalImpacts.filter((_, currentIndex) => currentIndex !== index),
                    }
                  : current,
              )
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InputField label="Area" value={item.area} onChange={(value) => onTechnicalImpactChange(index, "area", value)} placeholder="Security" />
              <InputField label="Owner" value={item.owner} onChange={(value) => onTechnicalImpactChange(index, "owner", value)} placeholder="Basis team" />
              <div className="md:col-span-2">
                <TextAreaField label="Impact" value={item.impact} onChange={(value) => onTechnicalImpactChange(index, "impact", value)} placeholder="Describe the architectural or delivery impact." rows={4} />
              </div>
            </div>
          </CollectionCard>
        ))
      )}
    </CollectionEditor>
  );
}

function NarrativeStepEditor({
  value,
  onChange,
}: {
  value: WizardNarrativeBlock;
  onChange: (value: WizardNarrativeBlock) => void;
}) {
  const bulletText = value.bullets.join("\n");

  return (
    <div className="grid gap-5">
      <TextAreaField
        label="Summary"
        value={value.summary}
        onChange={(nextSummary) => onChange({ ...value, summary: nextSummary })}
        placeholder="Write the concise narrative for this step."
        rows={5}
      />
      <TextAreaField
        label="Bullets"
        value={bulletText}
        onChange={(nextBulletText) =>
          onChange({
            ...value,
            bullets: nextBulletText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          })
        }
        placeholder="One bullet per line."
        rows={6}
      />
    </div>
  );
}

function CollectionEditor({
  title,
  description,
  children,
  onAdd,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
        >
          Add item
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function CollectionCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[1.45rem] border border-[var(--border)] bg-slate-50 px-5 py-5">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyCollectionMessage({ message }: { message: string }) {
  return <div className="rounded-[1.45rem] border border-dashed border-[var(--border)] bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">{message}</div>;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[1.15rem] border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-[1.15rem] border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

function MiniMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  const className = tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-[var(--border)] bg-white text-slate-900";
  return (
    <div className={`rounded-[1.2rem] border px-4 py-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function StatePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-slate-50 px-5 py-10 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function validateStep(step: SolutionWizardStepKey, draft: SolutionWizardContext | null) {
  if (!draft) {
    return ["Wizard data is not available yet."];
  }

  if (step === "context" || step === "businessProblem" || step === "currentProcess" || step === "futureProcess") {
    const block = draft[step];
    const errors: string[] = [];

    if (!block.summary.trim()) {
      errors.push("Summary is required.");
    }

    if (block.bullets.length === 0) {
      errors.push("At least one bullet is required.");
    }

    return errors;
  }

  if (step === "integrations") {
    return draft.integrations.flatMap((item, index) => {
      const errors: string[] = [];
      if (!item.name.trim()) {
        errors.push(`Integration ${index + 1}: name is required.`);
      }
      if (!item.description.trim()) {
        errors.push(`Integration ${index + 1}: description is required.`);
      }
      return errors;
    });
  }

  if (step === "businessRules") {
    return draft.businessRules.flatMap((item, index) => {
      const errors: string[] = [];
      if (!item.title.trim()) {
        errors.push(`Business rule ${index + 1}: title is required.`);
      }
      if (!item.description.trim()) {
        errors.push(`Business rule ${index + 1}: description is required.`);
      }
      return errors;
    });
  }

  return draft.technicalImpacts.flatMap((item, index) => {
    const errors: string[] = [];
    if (!item.area.trim()) {
      errors.push(`Technical impact ${index + 1}: area is required.`);
    }
    if (!item.impact.trim()) {
      errors.push(`Technical impact ${index + 1}: impact is required.`);
    }
    return errors;
  });
}

function hasStepContent(step: SolutionWizardStepKey, draft: SolutionWizardContext) {
  if (step === "context" || step === "businessProblem" || step === "currentProcess" || step === "futureProcess") {
    return Boolean(draft[step].summary.trim() || draft[step].bullets.length);
  }

  if (step === "integrations") {
    return draft.integrations.length > 0;
  }

  if (step === "businessRules") {
    return draft.businessRules.length > 0;
  }

  return draft.technicalImpacts.length > 0;
}

function isStepKey(step: string | null): step is SolutionWizardStepKey {
  return wizardSteps.some((item) => item.key === step);
}

function saveLabel(state: SaveState) {
  if (state === "saving") {
    return "Saving";
  }
  if (state === "saved") {
    return "Saved";
  }
  if (state === "error") {
    return "Attention";
  }
  return "Idle";
}

function formatUpdatedAt(value: string | undefined) {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
