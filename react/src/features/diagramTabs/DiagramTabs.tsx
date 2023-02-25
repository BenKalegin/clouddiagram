import React from "react";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";
import {HtmlDrop} from "./HtmlDrop";
import {Stack, styled, Tab, Tabs} from "@mui/material";
import {LinkToNewDialog} from "../classDiagram/dialogs/LinkToNewDialog";
import {atom, useRecoilState, useRecoilValue} from "recoil";
import {ElementType, Id} from "../../package/packageModel";
import {DiagramId, diagramKindSelector, diagramTitleSelector, linkingAtom} from "../diagramEditor/diagramEditorModel";
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

export const activeDiagramIdAtom = atom<Id>({
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
    const linking = useRecoilValue(linkingAtom)

    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId!))

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveDiagramId(openDiagramIds[newValue]);
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
            {/*{linking.showLinkToNewDialog && <LinkToNewDialog/>}*/}

        </Stack>
    )
}
