/*
 * Based on: 
 * https://github.com/contentful/apps/blob/c57d0fd819d82e22deee9eba68d8921f1db066b8/packages/dam-app-base/src/AppConfig/FieldSelector.tsx
 */
import * as React from 'react';
import { ContentType, ContentTypeField } from '@contentful/app-sdk'
import { Form, Subheading, CheckboxField, Typography } from '@contentful/forma-36-react-components';

export type CompatibleFields = Record<string, ContentTypeField[]>;
export type SelectedFields = Record<string, string[] | undefined>;

interface Props {
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
  onSelectedFieldsChange: Function;
}

export class FieldSelector extends React.Component<Props> {
  onSelectedFieldChange = (
    ctId: string,
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updated = { ...this.props.selectedFields };

    if (e.currentTarget.checked) {
      updated[ctId] = (updated[ctId] || []).concat([fieldId]);
    } else {
      updated[ctId] = (updated[ctId] || []).filter((cur) => cur !== fieldId);
    }

    this.props.onSelectedFieldsChange(updated);
  };

  render() {
    const { compatibleFields, contentTypes, selectedFields } = this.props;

    return (
      <Typography>
        {contentTypes.map((ct: ContentType) => {
          const fields = compatibleFields[ct.sys.id];
          return (
            <div key={ct.sys.id} /*className={css({ marginTop: tokens.spacingL })}*/>
              <Subheading>{ct.name}</Subheading>
              <Form>
                {fields.map((field: ContentTypeField) => (
                  <CheckboxField
                    key={field.id}
                    id={`field-box-${ct.sys.id}-${field.id}`}
                    labelText={field.name}
                    helpText={`Field ID: ${field.id}`}
                    checked={(selectedFields[ct.sys.id] || []).includes(field.id)}
                    onChange={this.onSelectedFieldChange.bind(this, ct.sys.id, field.id)}
                  />
                ))}
              </Form>
            </div>
          );
        })}
      </Typography>
    );
  }
}