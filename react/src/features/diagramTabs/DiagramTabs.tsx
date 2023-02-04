import React from "react";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {NodePropertiesDialog} from "../classDiagram/dialogs/NodePropertiesDialog";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";
import {HtmlDrop} from "./HtmlDrop";
import {Stack, styled, Tab, Tabs} from "@mui/material";
import {LinkToNewDialog} from "../classDiagram/dialogs/LinkToNewDialog";
import {atom, useRecoilState, useRecoilValue} from "recoil";
import {ElementType, Id} from "../../package/packageModel";
import {diagramKindSelector, diagramTitleSelector} from "../diagramEditor/diagramEditorModel";
import {DiagramId} from "../classDiagram/model";
import {demoActiveDiagramId, demoOpenDiagramIds} from "../demo";


interface StyledTabProps {
    diagramId: DiagramId
}

const objectWithoutKey = (object: any, key: string) => {
    const {[key]: deletedKey, ...otherKeys} = object;
    return otherKeys;
}

const PlainTab = styled((props: StyledTabProps) => {
    const label = useRecoilValue(diagramTitleSelector(props.diagramId)) ?? "New";

    return <Tab
        label = {label}
        {...objectWithoutKey(props, "diagramId")}
        disableRipple = {true}
    />;
    })(
    () => ({
        textTransform: 'none'
    }),
);

const activeDiagramIdAtom = atom<Id | undefined>({
    key: 'activeDiagramId',
    default: demoActiveDiagramId
})

const openDiagramIdsAtom = atom<DiagramId[]>({
    key: 'openDiagrams',
    default: demoOpenDiagramIds
})

export const DiagramTabs = () => {
    const [activeDiagramId, setActiveDiagramId] = useRecoilState(activeDiagramIdAtom);
    const openDiagramIds = useRecoilValue(openDiagramIdsAtom);

    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId!))

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        console.log("handleTabChange", newValue)
        if (newValue)
            setActiveDiagramId(openDiagramIds[newValue]);
        else
            setActiveDiagramId(undefined);
    }

    return (
        <Stack direction="column" spacing="2">
            <Tabs
                value={openDiagramIds.indexOf(activeDiagramId!)}
                onChange={handleTabChange}
                aria-label="Open diagrams"
            >
                {openDiagramIds.map((diagramId, index) =>
                    <PlainTab key={index} diagramId={diagramId}/>
                )}
            </Tabs>
            <div>
                <HtmlDrop>
                    {diagramKind === ElementType.ClassDiagram && <ClassDiagramEditor diagramId={activeDiagramId!}/>}
                    {diagramKind === ElementType.SequenceDiagram &&
                        <SequenceDiagramEditor diagramId={activeDiagramId!}/>}
                </HtmlDrop>
            </div>
            {diagramKind === ElementType.ClassDiagram && <NodePropertiesDialog/>}
            {diagramKind === ElementType.SequenceDiagram && <LinkToNewDialog/>}
        </Stack>
    )
}
