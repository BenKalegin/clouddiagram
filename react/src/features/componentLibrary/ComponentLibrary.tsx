import {INavLinkGroup, INavStyles, Nav} from "@fluentui/react";
import React from "react";

const navStyles: Partial<INavStyles> = { root: { width: 300 } };

const navLinkGroups: INavLinkGroup[] = [
    {
        name: 'Class',
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
        name: 'Sequence',
        expandAriaLabel: 'Expand Activity components section',
        collapseAriaLabel: 'Collapse Activity components section',
        links: [
            {
                key: 'actor',
                name: 'Actor',
                url: '#/actor',
            },
            {
                key: 'class',
                name: 'Class',
                url: '#/class',
            }
        ],
    }
];

export const ComponentLibrary = () =>
    <Nav
        styles={navStyles} ariaLabel="Components you can add to your diagram"
        groups={navLinkGroups}
    />;
