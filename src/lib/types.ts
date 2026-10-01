export interface Case {
  id: string;
  clientName: string;
  caseNumber: string;
  court: string;
  status: 'Active' | 'Closed';
  clientPhone?: string;
  caseType?: string;
  oppositeParty?: string;
  cnrNumber?: string;
  stage?: string;
  notes?: string;
  nextHearingDate?: string | null;
  ownerId: string;
  members: Record<string, string>;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Hearing {
  id: string;
  caseId: string;
  date: string;
  time?: string;
  notes?: string;
  result?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
