import React, { useEffect, useState, useRef } from 'react';
import { Paragraph, Notification, Select, Option, Button, Pill, Grid, GridItem } from '@contentful/forma-36-react-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { AppInstallationParameters } from './ConfigScreen';
import { getBaseUrl } from '../frosmo';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

interface FrosmoSegmentGroup {
  name: string;
}

interface FrosmoSegment {
  segment_name: string,
  title: string;
  group: null | FrosmoSegmentGroup
}

async function getSegments(token: AppInstallationParameters['graniittiToken'], region: AppInstallationParameters['region'], siteId: AppInstallationParameters['siteId']): Promise<FrosmoSegment[]> {
  const baseUrl = getBaseUrl(region);

  if (!baseUrl) {
    throw new Error(`Invalid region ${region}`);
  }

  const url = `${baseUrl}/sites/${siteId}/segments?includes=group`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const segments = await response.json() as FrosmoSegment[];
      
      return segments.map((s) => {
        return {
          title: s.title, 
          segment_name: s.segment_name, 
          group: s.group
        }
      });
    } else {
      switch (response.status) {
        case 401:
          Notification.error('Frosmo Access Token is invalid');
          // The server could not authenticate the request because the access token is invalid or missing.
          break;
        case 403:
          // The server could not authorize access to the target resource because the access token does not grant sufficient permission.
          Notification.error('This Frosmo Access Token is not valid for the given Site ID');
          break;
        case 404:
          // The server could not find the requested site.
          Notification.error('No Frosmo Site found with the given Site ID');
          break;
        default:
          Notification.error("Connection failed")
      }
      return [];
    }
  } catch (e) {
    Notification.error("Connection to Frosmo failed");
    return [];
  }
}

const Field = (props: FieldProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({graniittiToken: '', region: 'eu', siteId: null});
  const [segments, setSegments] = useState<FrosmoSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSegments(props.sdk.field.getValue() || []);
  }, [props.sdk]);

  useEffect(() => {
    async function fetchSegments() {
      const segments = await getSegments(parameters.graniittiToken, parameters.region, parameters.siteId);
      setSegments(segments);
    };

    if (parameters.graniittiToken) {
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
      Segment: '{selectedSegment}'
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
