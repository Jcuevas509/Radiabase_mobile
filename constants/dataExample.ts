import { MenuItemProps } from "types/componentsTypes";
import { DrawSvg, FilterSvg, MapSvg, MyLocationSvg, SearchSvg, SettingsSvg, UsersSvg } from 'components/svg';

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

export const menuItemsManager = [
    { id: 0, label: 'Area Management', route: '/', icon: DrawSvg },
    { id: 1, label: 'My Location', route: '/myLocation', icon: MyLocationSvg },
    { id: 2, label: 'Search', route: '/', icon: SearchSvg },
    { id: 3, label: 'Filter', route: '/profile', icon: FilterSvg },
    // { id: 4, label: 'Users', route: '/profile', icon: UsersSvg },
    // { id: 5, label: 'Settings', route: '/profile', icon: SettingsSvg },
];

export const menuItemsAgent = [
    { id: 0, label: 'Search', route: '/', icon: SearchSvg },
    { id: 1, label: 'Current Area', route: '/', icon: MapSvg },
    { id: 3, label: 'My Location', route: '/myLocation', icon: MyLocationSvg },
    { id: 3, label: 'My Areas', route: '/', icon: SearchSvg },
    { id: 4, label: 'Filter', route: '/profile', icon: FilterSvg },
    // { id: 5, label: 'Users', route: '/', icon: UsersSvg },
    // { id: 6, label: 'Settings', route: '/', icon: SettingsSvg },
];

export const dashboardData = {
    'Today': { leads: 10, customers: 5, recruits: 3 },
    'This Week': { leads: 50, customers: 25, recruits: 15 },
    'This Month': { leads: 200, customers: 100, recruits: 60 }
};