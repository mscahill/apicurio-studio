/**
 * @license
 * Copyright 2017 JBoss Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, EventEmitter, Input, Output, QueryList, ViewChildren} from "@angular/core";
import {ModalDirective} from "ngx-bootstrap";
import {
    CodeEditorComponent,
    CodeEditorMode,
    CodeEditorTheme
} from "../../../../../../components/common/code-editor.component";
import {ObjectUtils} from "../../../../../../util/common";
import * as YAML from "yamljs";
import {Oas20Schema, Oas30Example} from "oai-ts-core";
import {StringUtils} from "../../_util/object.util";
import {ModelUtils} from "../../_util/model.util";


export interface EditExample20Event {
    contentType: string;
    value: any;
}

@Component({
    moduleId: module.id,
    selector: "edit-example-20-dialog",
    templateUrl: "edit-example-20.component.html",
    styleUrls: [ "edit-example.component.css" ]
})
export class EditExample20DialogComponent {

    @Input() schema: Oas20Schema;
    @Output() onEdit: EventEmitter<EditExample20Event> = new EventEmitter<EditExample20Event>();

    @ViewChildren("editExampleModal") editExampleModal: QueryList<ModalDirective>;
    @ViewChildren("codeEditor") codeEditor: QueryList<CodeEditorComponent>;

    private example: Oas30Example;
    protected _isOpen: boolean = false;

    protected model: any = {
        contentType: null,
        value: null,
        format: CodeEditorMode.JSON,
        valid: true
    };

    get value() {
        return this.model.value;
    }
    set value(value: string) {
        this.setValueFormatFromValue(value);
        this.model.value = value;
    }

    /**
     * Called to open the dialog.
     * @param contentType
     * @param value
     */
    public open(contentType: string, value: any): void {
        this._isOpen = true;
        this.model = {
            contentType: contentType,
            value: null,
            format: CodeEditorMode.JSON,
            valid: true
        };

        let val: any = value;
        if (StringUtils.isJSON(val)) {
            try { val = JSON.stringify(JSON.parse(val), null, 4); } catch (e) {}
        }
        if (typeof val === "object") {
            val = JSON.stringify(val, null, 4);
        }

        this.model.value = val;
        this.setValueFormatFromValue(val);

        this.editExampleModal.changes.subscribe( () => {
            if (this.editExampleModal.first) {
                this.editExampleModal.first.show();
            }
        });
    }

    /**
     * Called to close the dialog.
     */
    public close(): void {
        this._isOpen = false;
    }

    /**
     * Called when the user clicks "edit".
     */
    protected edit(): void {
        let event: EditExample20Event = {
            contentType: this.model.contentType,
            value: this.model.value
        };
        // TODO investigate whether to restore this functionality (treat JSON data differently)
        // if (this.model.valid && this.model.format === CodeEditorMode.JSON) {
        //     try {
        //         event.value = JSON.parse(this.model.value);
        //     } catch (e) {
        //         console.error("[EditExample20DialogComponent] Failed to parse example.");
        //     }
        // }
        this.onEdit.emit(event);
        this.cancel();
    }

    /**
     * Called when the user clicks "cancel".
     */
    protected cancel(): void {
        this.editExampleModal.first.hide();
    }

    /**
     * Returns true if the dialog is open.
     * 
     */
    public isOpen(): boolean {
        return this._isOpen;
    }

    public valueEditorTheme(): CodeEditorTheme {
        return CodeEditorTheme.Light;
    }

    public valueEditorMode(): CodeEditorMode {
        return this.model.format;
    }

    public hasValue(): boolean {
        return !ObjectUtils.isNullOrUndefined(this.model.value);
    }

    /**
     * @param value
     */
    private setValueFormatFromValue(value: string): void {
        if (StringUtils.isJSON(value)) {
            this.model.format = CodeEditorMode.JSON;
            try {
                JSON.parse(value);
                this.model.valid = true;
            } catch (e) {}
        } else if (StringUtils.isXml(value)) {
            this.model.format = CodeEditorMode.XML;
        } else {
            this.model.format = CodeEditorMode.YAML;
            try {
                YAML.parse(value);
                this.model.valid = true;
            } catch (e) {}
        }
    }

    public canGenerateExample(): boolean {
        return this.schema !== null && this.schema !== undefined;
    }

    public generate(): void {
        let example: any = ModelUtils.generateExampleFromSchema(this.schema);
        let exampleStr: string = JSON.stringify(example, null, 4);
        this.codeEditor.first.setText(exampleStr);
    }

}
