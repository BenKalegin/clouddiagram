module Five {
    export class Form {
        constructor(className: string) {
            this.table = document.createElement('table');
            this.table.className = className;
            this.body = document.createElement('tbody');
            this.table.appendChild(this.body);
        }

        /** Holds the DOM node that represents the table. */
        table: HTMLTableElement;

        /** Holds the DOM node that represents the tbody (table body). New rows can be added to this object using DOM API. */
        private body: HTMLTableSectionElement;

        /** Returns the table that contains this form. */
        private getTable(): HTMLTableElement {
            return this.table;
        }

        /** Helper method to add an OK and Cancel button using the respective functions. */
        addButtons(okFunct, cancelFunct) {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            tr.appendChild(td);
            td = document.createElement('td');

            // Adds the ok button
            var button = document.createElement('button');
            Utils.write(button, Resources.get('OK'));
            td.appendChild(button);

            Events.addListener(button, 'click', () => okFunct());

            // Adds the cancel button
            button = document.createElement('button');
            Utils.write(button, Resources.get('Cancel'));
            td.appendChild(button);
            Events.addListener(button, 'click', () => cancelFunct());

            tr.appendChild(td);
            this.body.appendChild(tr);
        }

        /** Adds a textfield for the given name and value and returns the textfield. */
        addText(name: string, value: string) : HTMLInputElement {
            var input = document.createElement('input');

            input.type = 'text';
            input.value = value;

            this.addField(name, input);
            return input;
        }

        /** Adds a checkbox for the given name and value and returns the textfield. */
        addCheckbox(name: string, value: string): HTMLInputElement {
            var input = document.createElement('input');

            input.type = 'checkbox';
            this.addField(name, input);

            // IE can only change the checked value if the input is inside the DOM
            if (value) {
                input.checked = true;
            }

            return input;
        }

        /** Adds a textarea for the given name and value and returns the textarea. */
        addTextarea(name: string, value: string, rows = 2) : Element {
            var input = document.createElement('textarea');

            if (Client.isNs) {
                rows--;
            }

            input.rows = rows;
            input.value = value;

            return this.addField(name, input);
        }

        /** Adds a combo for the given name and returns the combo. */
        addCombo(name: string, isMultiSelect: boolean, size: number): Element {
            var select = document.createElement('select');

            if (size != null) {
                select.size = size;
            }

            if (isMultiSelect) {
                select.multiple = true;
            }

            return this.addField(name, select);
        }

        /** Adds an option for the given label to the specified combo. */
        addOption(combo: Element, label, value, isSelected) {
            var option = document.createElement('option');

            Utils.writeln(option, label);
            option.value = value;

            if (isSelected) {
                option.selected = isSelected;
            }

            combo.appendChild(option);
        }

        /** Adds a new row with the name and the input field in two columns and returns the given input. */
        private addField(name: string, input: Element) : Element {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            Utils.write(td, name);
            tr.appendChild(td);

            td = document.createElement('td');
            td.appendChild(input);
            tr.appendChild(td);
            this.body.appendChild(tr);

            return input;
        }

    }
} 