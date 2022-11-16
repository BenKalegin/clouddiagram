import {INavLinkGroup, INavStyles, Nav} from "@fluentui/react";
import React from "react";

const navStyles: Partial<INavStyles> = { root: { width: 300 } };

const navLinkGroups: INavLinkGroup[] = [
    {
        name: 'Basic components',
        expandAriaLabel: 'Expand Basic components section',
        collapseAriaLabel: 'Collapse Basic components section',
        links: [
            {
                key: 'node',
                name: 'Node',
                url: '#/node',
            },
            {
                key: 'Something else',
                name: 'Something else',
                url: '#/Something else',
            }
        ],
    },
    {
        name: 'Activity components',
        expandAriaLabel: 'Expand Activity components section',
        collapseAriaLabel: 'Collapse Activity components section',
        links: [
            {
                key: 'activity1',
                name: 'Activity Component 1',
                url: '#/activity1',
            },
            {
                key: 'activity2',
                name: 'Activity Component 2',
                url: '#/activity2',
            }
        ],
    }
];

export const ComponentLibrary = () =>
    <Nav
        styles={navStyles} ariaLabel="Components you can add to your diagram"
        groups={navLinkGroups}
    />;
