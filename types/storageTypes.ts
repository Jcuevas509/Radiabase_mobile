export type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'manager' | 'agent';
    roleLabel: string;
    salesOrgId: number | null;
    officeId: number | null;
    officeName: string | null;
    structureName: string | null;
    verticalId: number | null;
};

export type Session = {
    token: string;
    user: User;
};
