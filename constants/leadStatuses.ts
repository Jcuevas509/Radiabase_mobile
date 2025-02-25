import React from 'react';
import { NewSvg, NotInterestedSvg, NotHomeSvg, GoBackSvg, CallSvg, UndoSvg, CheckmarkSvg, CancelSvg, SignatureSvg } from '../components/svg';
import { LeadStatus, SvgProps } from '../types/componentsTypes';



export const leadStatuses: LeadStatus[] = [
    {
        statusId: 0,
        shortName: "NEW",
        fullName: "New",
        color: "#1A75C6", // Blue color,
        icon: NewSvg
    },
    {
        statusId: 1,
        shortName: "NI",
        fullName: "Not Interested",
        color: "#F90114",// Red color
        icon: NotInterestedSvg
    },
    {
        statusId: 2,
        shortName: "NH",
        fullName: "Not Home",
        color: "#F9B20F", // Orange color
        icon: NotHomeSvg
    },
    {
        statusId: 3,
        shortName: "GB",
        fullName: "Go Back",
        color: "#0DFCDF", // Green color
        icon: GoBackSvg
    },
    {
        statusId: 4,
        shortName: "CB",
        fullName: "Call Back",
        color: "#A300FF", // Purple color,
        icon: CallSvg
    }
];

export const customerStatuses: LeadStatus[] = [
    {
        statusId: 0,
        shortName: "NS",
        fullName: "Presented - Not sold",
        color: "#1A75C6", // Blue color,
        icon: UndoSvg
    },
    {
        statusId: 1,
        shortName: "SIGN",
        fullName: "Signed",
        color: "#276E11",// Red color
        icon: SignatureSvg
    },
    {
        statusId: 2,
        shortName: "CANC",
        fullName: "Cancelled",
        color: "#F90114", // Orange color
        icon: CancelSvg
    },
    {
        statusId: 3,
        shortName: "INST",
        fullName: "Installed",
        color: "black", // Green color
        icon: CheckmarkSvg
    },
];