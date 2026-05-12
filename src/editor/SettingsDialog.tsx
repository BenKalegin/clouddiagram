import {useContext, useState} from "react";
import {Dialog, DialogBody, DialogFooter, DialogHeader, THEMES, ThemeGroup, ThemeId} from "@benkalegin/ui26";
import {AppLayoutContext, setThemeId, toggleShowGrid} from "./editorLayout";
import "./SettingsDialog.css";

type SettingsTab = "skins" | "presentation";

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export function SettingsDialog({open, onClose}: SettingsDialogProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("skins");
    return (
        <Dialog open={open} onClose={onClose} className="cd-settings-dialog" ariaLabel="Settings">
            <DialogHeader onClose={onClose}>Settings</DialogHeader>
            <DialogBody className="cd-settings-body">
                <nav className="cd-settings-nav" aria-label="Settings sections">
                    <button
                        type="button"
                        className={`cd-settings-nav__item${activeTab === "skins" ? " cd-settings-nav__item--active" : ""}`}
                        onClick={() => setActiveTab("skins")}
                    >
                        Skins
                    </button>
                    <button
                        type="button"
                        className={`cd-settings-nav__item${activeTab === "presentation" ? " cd-settings-nav__item--active" : ""}`}
                        onClick={() => setActiveTab("presentation")}
                    >
                        Diagram presentation
                    </button>
                </nav>
                <div className="cd-settings-content">
                    {activeTab === "skins" && <SkinsTab/>}
                    {activeTab === "presentation" && <PresentationTab/>}
                </div>
            </DialogBody>
            <DialogFooter>
                <button type="button" className="cd-settings-close" onClick={onClose}>Close</button>
            </DialogFooter>
        </Dialog>
    );
}

function SkinsTab() {
    const {appLayout, setAppLayout} = useContext(AppLayoutContext);
    const darkThemes = THEMES.filter(t => t.group === ThemeGroup.Dark);
    const lightThemes = THEMES.filter(t => t.group === ThemeGroup.Light);
    const handleSelect = (id: ThemeId) => setAppLayout(prev => setThemeId(prev, id));
    return (
        <>
            <ThemeGroupSection title="Dark" themes={darkThemes} activeId={appLayout.themeId} onSelect={handleSelect}/>
            <ThemeGroupSection title="Light" themes={lightThemes} activeId={appLayout.themeId} onSelect={handleSelect}/>
        </>
    );
}

interface ThemeGroupSectionProps {
    title: string;
    themes: typeof THEMES;
    activeId: ThemeId;
    onSelect: (id: ThemeId) => void;
}

function ThemeGroupSection({title, themes, activeId, onSelect}: ThemeGroupSectionProps) {
    return (
        <section className="cd-settings-theme-group">
            <div className="cd-settings-theme-group__title">{title}</div>
            <div className="cd-settings-theme-grid">
                {themes.map(theme => (
                    <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isActive={theme.id === activeId}
                        onSelect={() => onSelect(theme.id)}
                    />
                ))}
            </div>
        </section>
    );
}

interface ThemeCardProps {
    theme: (typeof THEMES)[number];
    isActive: boolean;
    onSelect: () => void;
}

function ThemeCard({theme, isActive, onSelect}: ThemeCardProps) {
    const {bgBase, bgSurface, textPrimary, accent} = theme.colors;
    const previewColors = [bgBase, bgSurface, textPrimary, accent];
    return (
        <button
            type="button"
            className={`cd-settings-theme-card${isActive ? " cd-settings-theme-card--active" : ""}`}
            onClick={onSelect}
            aria-pressed={isActive}
        >
            <div className="cd-settings-theme-card__preview">
                {previewColors.map((color, i) => (
                    <div key={i} className="cd-settings-theme-card__bar" style={{backgroundColor: color}}/>
                ))}
            </div>
            <span className="cd-settings-theme-card__label">{theme.label}</span>
        </button>
    );
}

function PresentationTab() {
    const {appLayout, setAppLayout} = useContext(AppLayoutContext);
    return (
        <section className="cd-settings-section">
            <label className="cd-settings-checkbox">
                <input
                    type="checkbox"
                    checked={appLayout.showGrid}
                    onChange={() => setAppLayout(prev => toggleShowGrid(prev))}
                />
                <span>Show grid</span>
            </label>
        </section>
    );
}
