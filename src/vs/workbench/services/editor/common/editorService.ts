/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { IResourceInput, IEditorOptions, ITextEditorOptions } from 'vs/platform/editor/common/editor';
import { IEditorInput, IEditorPane, GroupIdentifier, IEditorInputWithOptions, IUntitledTextResourceInput, IResourceDiffInput, ITextEditorPane, ITextDiffEditorPane, IEditorIdentifier, ISaveOptions, IRevertOptions, EditorsOrder, IVisibleEditorPane } from 'vs/workbench/common/editor';
import { Event } from 'vs/base/common/event';
import { IEditor, IDiffEditor } from 'vs/editor/common/editorCommon';
import { IEditorGroup, IEditorReplacement } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IDisposable } from 'vs/base/common/lifecycle';

export const IEditorService = createDecorator<IEditorService>('editorService');

export type IResourceEditor = IResourceInput | IUntitledTextResourceInput | IResourceDiffInput;

export interface IResourceEditorReplacement {
	readonly editor: IResourceEditor;
	readonly replacement: IResourceEditor;
}

export const ACTIVE_GROUP = -1;
export type ACTIVE_GROUP_TYPE = typeof ACTIVE_GROUP;

export const SIDE_GROUP = -2;
export type SIDE_GROUP_TYPE = typeof SIDE_GROUP;

export interface IOpenEditorOverrideHandler {
	(editor: IEditorInput, options: IEditorOptions | ITextEditorOptions | undefined, group: IEditorGroup): IOpenEditorOverride | undefined;
}

export interface IOpenEditorOverride {

	/**
	 * If defined, will prevent the opening of an editor and replace the resulting
	 * promise with the provided promise for the openEditor() call.
	 */
	override?: Promise<IEditorPane | undefined>;
}

export interface ISaveEditorsOptions extends ISaveOptions {

	/**
	 * If true, will ask for a location of the editor to save to.
	 */
	readonly saveAs?: boolean;
}

export interface IBaseSaveRevertAllEditorOptions {

	/**
	 * Whether to include untitled editors as well.
	 */
	readonly includeUntitled?: boolean;
}

export interface ISaveAllEditorsOptions extends ISaveEditorsOptions, IBaseSaveRevertAllEditorOptions { }

export interface IRevertAllEditorsOptions extends IRevertOptions, IBaseSaveRevertAllEditorOptions { }

export interface IEditorService {

	_serviceBrand: undefined;

	/**
	 * Emitted when the currently active editor changes.
	 *
	 * @see `IEditorService.activeEditor`
	 */
	readonly onDidActiveEditorChange: Event<void>;

	/**
	 * Emitted when any of the current visible editors changes.
	 *
	 * @see `IEditorService.visibleEditors`
	 */
	readonly onDidVisibleEditorsChange: Event<void>;

	/**
	 * The currently active editor pane or `undefined` if none. The editor pane is
	 * the workbench container for editors of any kind.
	 *
	 * @see `IEditorService.activeEditor`
	 */
	readonly activeEditorPane: IVisibleEditorPane | undefined;

	/**
	 * The currently active editor or `undefined` if none. An editor is active when it is
	 * located in the currently active editor group. It will be `undefined` if the active
	 * editor group has no editors open.
	 */
	readonly activeEditor: IEditorInput | undefined;

	/**
	 * The currently active text editor control or `undefined` if there is currently no active
	 * editor or the active editor widget is neither a text nor a diff editor.
	 *
	 * @see `IEditorService.activeEditor`
	 */
	readonly activeTextEditorControl: IEditor | IDiffEditor | undefined;

	/**
	 * The currently active text editor mode or `undefined` if there is currently no active
	 * editor or the active editor control is neither a text nor a diff editor. If the active
	 * editor is a diff editor, the modified side's mode will be taken.
	 */
	readonly activeTextEditorMode: string | undefined;

	/**
	 * All editor panes that are currently visible across all editor groups.
	 */
	readonly visibleEditorPanes: ReadonlyArray<IVisibleEditorPane>;

	/**
	 * All editors that are currently visible. An editor is visible when it is opened in an
	 * editor group and active in that group. Multiple editor groups can be opened at the same time.
	 */
	readonly visibleEditors: ReadonlyArray<IEditorInput>;

	/**
	 * All text editor widgets that are currently visible across all editor groups. A text editor
	 * widget is either a text or a diff editor.
	 */
	readonly visibleTextEditorControls: ReadonlyArray<IEditor | IDiffEditor>;

	/**
	 * All editors that are opened across all editor groups in sequential order
	 * of appearance.
	 *
	 * This includes active as well as inactive editors in each editor group.
	 */
	readonly editors: ReadonlyArray<IEditorInput>;

	/**
	 * The total number of editors that are opened either inactive or active.
	 */
	readonly count: number;

	/**
	 * All editors that are opened across all editor groups with their group
	 * identifier.
	 *
	 * @param order the order of the editors to use
	 */
	getEditors(order: EditorsOrder): ReadonlyArray<IEditorIdentifier>;

	/**
	 * Open an editor in an editor group.
	 *
	 * @param editor the editor to open
	 * @param options the options to use for the editor
	 * @param group the target group. If unspecified, the editor will open in the currently
	 * active group. Use `SIDE_GROUP_TYPE` to open the editor in a new editor group to the side
	 * of the currently active group.
	 *
	 * @returns the editor that opened or `undefined` if the operation failed or the editor was not
	 * opened to be active.
	 */
	openEditor(editor: IEditorInput, options?: IEditorOptions | ITextEditorOptions, group?: IEditorGroup | GroupIdentifier | SIDE_GROUP_TYPE | ACTIVE_GROUP_TYPE): Promise<IEditorPane | undefined>;
	openEditor(editor: IResourceInput | IUntitledTextResourceInput, group?: IEditorGroup | GroupIdentifier | SIDE_GROUP_TYPE | ACTIVE_GROUP_TYPE): Promise<ITextEditorPane | undefined>;
	openEditor(editor: IResourceDiffInput, group?: IEditorGroup | GroupIdentifier | SIDE_GROUP_TYPE | ACTIVE_GROUP_TYPE): Promise<ITextDiffEditorPane | undefined>;

	/**
	 * Open editors in an editor group.
	 *
	 * @param editors the editors to open with associated options
	 * @param group the target group. If unspecified, the editor will open in the currently
	 * active group. Use `SIDE_GROUP_TYPE` to open the editor in a new editor group to the side
	 * of the currently active group.
	 *
	 * @returns the editors that opened. The array can be empty or have less elements for editors
	 * that failed to open or were instructed to open as inactive.
	 */
	openEditors(editors: IEditorInputWithOptions[], group?: IEditorGroup | GroupIdentifier | SIDE_GROUP_TYPE | ACTIVE_GROUP_TYPE): Promise<ReadonlyArray<IEditorPane>>;
	openEditors(editors: IResourceEditor[], group?: IEditorGroup | GroupIdentifier | SIDE_GROUP_TYPE | ACTIVE_GROUP_TYPE): Promise<ReadonlyArray<IEditorPane>>;

	/**
	 * Replaces editors in an editor group with the provided replacement.
	 *
	 * @param editors the editors to replace
	 *
	 * @returns a promise that is resolved when the replaced active
	 * editor (if any) has finished loading.
	 */
	replaceEditors(editors: IResourceEditorReplacement[], group: IEditorGroup | GroupIdentifier): Promise<void>;
	replaceEditors(editors: IEditorReplacement[], group: IEditorGroup | GroupIdentifier): Promise<void>;

	/**
	 * Find out if the provided editor is opened in any editor group.
	 *
	 * Note: An editor can be opened but not actively visible.
	 *
	 * @param editor the editor to check for being opened. If a
	 * `IResourceInput` is passed in, the resource is checked on
	 * all opened editors. In case of a side by side editor, the
	 * right hand side resource is considered only.
	 */
	isOpen(editor: IResourceInput): boolean;
	isOpen(editor: IEditorInput): boolean;

	/**
	 * Allows to override the opening of editors by installing a handler that will
	 * be called each time an editor is about to open allowing to override the
	 * operation to open a different editor.
	 */
	overrideOpenEditor(handler: IOpenEditorOverrideHandler): IDisposable;

	/**
	 * Invoke a function in the context of the services of the active editor.
	 */
	invokeWithinEditorContext<T>(fn: (accessor: ServicesAccessor) => T): T;

	/**
	 * Converts a lightweight input to a workbench editor input.
	 */
	createInput(input: IResourceEditor): IEditorInput;

	/**
	 * Save the provided list of editors.
	 *
	 * @returns `true` if all editors saved and `false` otherwise.
	 */
	save(editors: IEditorIdentifier | IEditorIdentifier[], options?: ISaveEditorsOptions): Promise<boolean>;

	/**
	 * Save all editors.
	 *
	 * @returns `true` if all editors saved and `false` otherwise.
	 */
	saveAll(options?: ISaveAllEditorsOptions): Promise<boolean>;

	/**
	 * Reverts the provided list of editors.
	 */
	revert(editors: IEditorIdentifier | IEditorIdentifier[], options?: IRevertOptions): Promise<void>;

	/**
	 * Reverts all editors.
	 */
	revertAll(options?: IRevertAllEditorsOptions): Promise<void>;
}
