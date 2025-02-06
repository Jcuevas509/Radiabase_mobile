interface Person {
    id: number;
    name: string;
    lastname: string;
    description: string;
    color: string;
}

export const peopleData: Person[] = [
    {
        id: 1,
        name: "John",
        lastname: "Doe",
        description: "Sales Representative",
        color: "#FF5733",
    },
    {
        id: 2,
        name: "Jane",
        lastname: "Smith",
        description: "Team Leader",
        color: "#33FF57",
    },
    {
        id: 3,
        name: "Alice",
        lastname: "Johnson",
        description: "Marketing Specialist",
        color: "#3357FF",
    },
    {
        id: 4,
        name: "Bob",
        lastname: "Brown",
        description: "Software Engineer",
        color: "#FFC300",
    },
    {
        id: 5,
        name: "Charlie",
        lastname: "Davis",
        description: "Product Manager",
        color: "#FF33A8",
    },
];