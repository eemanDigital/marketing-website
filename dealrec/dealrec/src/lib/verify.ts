export type VerifiableArtifact = {
  id: string;
  label: string;
  group: string;
  detail?: string;
  expectedFingerprint: string;
};
