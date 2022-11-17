import styles from './DiagramContainer.module.scss';
import {DiagramCanvas} from "../features/classDiagram/DiagramCanvas";
import {Stack} from "@fluentui/react";
import {OpenDiagramSelector} from "../features/opendiagramSelector/OpenDiagramSelector";
import React from "react";

export const DiagramContainer = () =>
    <Stack horizontal={false} verticalFill={true}  >
        <Stack.Item align={"start"}>
            <OpenDiagramSelector/>
        </Stack.Item>
        <Stack.Item>
            <div className={styles.container}>
                <DiagramCanvas/>
            </div>;
        </Stack.Item>
    </Stack>

