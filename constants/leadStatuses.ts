import React from 'react';
import { NewSvg, NotInterestedSvg, NotHomeSvg, GoBackSvg, CallSvg } from '../components/svg';
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