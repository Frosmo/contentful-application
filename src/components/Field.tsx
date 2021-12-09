import React, { useEffect, useState } from 'react';
import { Paragraph, Select, Option, Pill, Grid, GridItem, Note, Flex } from '@contentful/forma-36-react-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Config as AppInstallationParameters, getSegments, Segment as FrosmoSegment } from '../graniitti';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const Field = (props: FieldProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({token: '', region: 'eu', siteId: 0});
  const [segments, setSegments] = useState<FrosmoSegment[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setSelectedSegments(props.sdk.field.getValue() || []);
  }, [props.sdk]);

  useEffect(() => {
    async function fetchSegments() {
      try {
        const segments = await getSegments(parameters);
        setSegments(segments);
      } catch (error) {
        setError('Unable to load Frosmo segments. Check the Frosmo app configuration.');
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

    // Function that resizes iframe on height changes
    props.sdk.window.startAutoResizer()
  }, [props.sdk]);

  function renderSegmentsSelector() {
    const segmentList = props.sdk.field.getValue();
    const selectOption = [<Option key={0} value="">Select a Frosmo segment</Option>];
    const options = segments.map(segment => {
      const disabled = segmentList && segmentList.indexOf(segment.segment_name) >= 0;
      return <Option key={segment.segment_name} value={segment.segment_name} disabled={disabled}>{segment.group ? segment.group.name + ' - ' : ''} {segment.title}</Option>
    });

    return <Grid columns="2fr 1fr" rowGap="spacingM" columnGap="spacingM">
      <GridItem>
        <Select
          name="segments"
          id="segments"
          onChange={(event) => event.target.value && addFrosmoSegment(event.target.value)}
        >
          {selectOption.concat(options)}
        </Select>
      </GridItem>
    </Grid>
  }

  async function addFrosmoSegment(segment: any) {
    let segmentList = props.sdk.field.getValue();
    if (!segmentList) {
      segmentList = [];
    }
    const newList = [...segmentList];
    newList.push(segment);
    await props.sdk.field.setValue(newList);
    setSelectedSegments(newList);
  }

  async function removeFrosmoSegment(segment: string) {
    const segmentList = props.sdk.field.getValue();
    if (!segmentList || segmentList.length === 0) {
      return;
    }
    const index = segmentList.indexOf(segment);

    if (index >= 0) {
      const newList = segmentList.filter((s: FrosmoSegment, i: number) => i !== index)
      await props.sdk.field.setValue(newList);
      setSelectedSegments(newList);
    }
  }

  function renderSelectedSegments() {
    const list = selectedSegments.map((segmentName, index) => {
      const segment: FrosmoSegment | undefined = segments.find(s => s.segment_name === segmentName);
      const segmentLabel = segment ? (segment.group ? segment.group.name + ' - ' : '') + segment.title : segmentName;

      return <Pill
        key={index}
        tabIndex={index}
        testId="pill-item"
        label={segmentLabel}
        onClose={() => {removeFrosmoSegment(segmentName)}}
        style={{marginRight: '5px', marginBottom: '5px'}}
      />
    });

    return <>{list}</>
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
    {segments.length > 0 && renderSegmentsSelector()}
    <Flex flexWrap="wrap" marginTop="spacingM">
      {selectedSegments.length === 0 && <Paragraph>No segments selected.</Paragraph>}
      {selectedSegments.length > 0 && renderSelectedSegments()}
    </Flex>
  </>;
};

export default Field;