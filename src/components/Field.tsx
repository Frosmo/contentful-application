import React, { useEffect, useState } from 'react';
import { Paragraph, Notification, Select, Option, Button, Pill, Grid, GridItem, Note } from '@contentful/forma-36-react-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
// import { AppInstallationParameters } from './ConfigScreen';
import { Config as AppInstallationParameters, getSegments, GraniittiError, Segment as FrosmoSegment } from '../graniitti';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const Field = (props: FieldProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({token: '', region: 'eu', siteId: 0});
  const [segments, setSegments] = useState<FrosmoSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setSelectedSegments(props.sdk.field.getValue() || []);
  }, [props.sdk]);

  useEffect(() => {
    async function fetchSegments() {
      try {
        const segments = await getSegments(parameters);
        setSegments(segments);
      } catch (error) {
        if (error instanceof GraniittiError) {
          Notification.error(error.message);
        } else {
          Notification.error("Connection to Frosmo failed");
        }
        setError('Unable to load Frosmo segments. Please check the application configuration!');
      }
    };

    if (parameters.token) {
      fetchSegments();
    }
  }, [parameters]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      const currentParameters: AppInstallationParameters = props.sdk.parameters.installation as AppInstallationParameters;

      if (currentParameters) {
        setParameters(currentParameters);
      }
    })();
  }, [props.sdk]);

  function renderSegmentsSelector() {
    const segmentList = props.sdk.field.getValue();
    const selectOption = [<Option value="">Select a Frosmo segment</Option>];
    const options = segments.map(segment => {
      const disabled = segmentList && segmentList.indexOf(segment.segment_name) >= 0;
      return <Option value={segment.segment_name} disabled={disabled}>{segment.group ? segment.group.name + ' - ' : ''} {segment.title}</Option>
    });

    return <Grid columns="2fr 1fr" rowGap="spacingM" columnGap="spacingM">
      <GridItem>
        <Select
          name="segments"
          id="segments"
          onChange={(event) => setSelectedSegment(event.target.value)}
        >
          {selectOption.concat(options)}
        </Select>
      </GridItem>
      <GridItem>
        <Button buttonType="primary" disabled={!selectedSegment} onClick={() => addFrosmoSegment(selectedSegment)}>Add</Button>
      </GridItem>
    </Grid>
  }

  async function addFrosmoSegment(segment: any) {
    let segmentList = props.sdk.field.getValue();

    if (!segmentList) {
      segmentList = [];
    }
    segmentList.push(segment);
    await props.sdk.field.setValue(segmentList);
    setSelectedSegments(segmentList);
  }

  async function removeFrosmoSegment(segment: string) {
    const segmentList = props.sdk.field.getValue();
    if (!segmentList || segmentList.length === 0) {
      return;
    }
    const index = segmentList.indexOf(segment);

    if (index >= 0) {
      const newList = segmentList.filter((s, i) => i !== index)
      await props.sdk.field.setValue(newList);
      setSelectedSegments(newList);
    }
  }

  function renderSelectedSegments() {
    const list = selectedSegments.map((segmentName, index) => {
      const segment: FrosmoSegment | undefined = segments.find(s => s.segment_name === segmentName);
      if (!segment) {
        return <Pill
          tabIndex={index}
          testId="pill-item"
          label={segmentName}
          onClose={() => {removeFrosmoSegment(segmentName)}}
          style={{marginRight: '5px', marginBottom: '5px'}}
        />;
      }
      return <Pill
        tabIndex={index}
        testId="pill-item"
        label={segment.title}
        onClose={() => {removeFrosmoSegment(segmentName)}}
        style={{marginRight: '5px', marginBottom: '5px'}}
      />
    });

    return list;
  }

  if (error) {
    return <>
      <Paragraph><Note noteType="negative">{error}</Note></Paragraph>
    </>
  }
  

  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return <>
    {selectedSegments.length === 0 && <Paragraph>No Frosmo segments linked to the content. <img src="frosmo_logo.png" alt="Frosmo logo" height="15px"></img></Paragraph>}
    {selectedSegments.length > 0 && renderSelectedSegments()}
    {segments.length > 0 && renderSegmentsSelector()}
  </>;
};

export default Field;
