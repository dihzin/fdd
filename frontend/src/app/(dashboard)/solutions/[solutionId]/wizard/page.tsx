import { SolutionWizard } from "@/modules/solutions/solution-wizard";

export default async function SolutionWizardPage({
  params,
}: {
  params: Promise<{ solutionId: string }>;
}) {
  const { solutionId } = await params;

  return <SolutionWizard solutionId={solutionId} />;
}
