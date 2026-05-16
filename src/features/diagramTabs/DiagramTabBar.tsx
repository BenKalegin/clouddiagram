import { Tabs, TabList } from "@benkalegin/ui26";
import { useAtom, useAtomValue } from "jotai";
import { activeDiagramIdAtom, openDiagramIdsAtom } from "./diagramTabsModel";
import { PlainTab } from "./DiagramTab";
import { AddNewTabButton } from "./AddNewTabButton";
import "./DiagramTabs.css";

export const DiagramTabBar = () => {
    const [activeDiagramId, setActiveDiagramId] = useAtom(activeDiagramIdAtom);
    const openDiagramIds = useAtomValue(openDiagramIdsAtom);

    return (
        <div className="diagram-tabs-row">
            <Tabs value={activeDiagramId ?? ""} onValueChange={setActiveDiagramId}>
                <TabList ariaLabel="Open diagrams" className="diagram-tabs-list">
                    {openDiagramIds.map((diagramId) => (
                        <PlainTab key={diagramId} diagram_id={diagramId} />
                    ))}
                </TabList>
            </Tabs>
            <AddNewTabButton/>
        </div>
    );
};
