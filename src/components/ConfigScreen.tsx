import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { HelpText, Heading, Form, Workbench, Paragraph, TextField, SelectField, Option, Button, Spinner, Notification } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { FrosmoSite, getBaseUrl } from '../frosmo';

export interface AppInstallationParameters {
  graniittiToken: string;
  region: 'eu' | 'fi1' | 'asia' | 'us' | 'eu2';
  siteId: number | null;
}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

const Config = (props: ConfigProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({graniittiToken: '', region: 'eu', siteId: null});
  const [isTestConnectionLoading, setTestConnectionLoading] = useState<boolean>(false);

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await props.sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, props.sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => onConfigure());
  }, [props.sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await props.sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      props.sdk.app.setReady();
    })()
  }, [props.sdk])

  function onTokenUpdate(token: AppInstallationParameters['graniittiToken']) {
    setParameters({...parameters, graniittiToken: token})
  }
  
  function onSiteIdUpdate(siteId: AppInstallationParameters['siteId']) {
    setParameters({...parameters, siteId: siteId})
  }

  function onRegionUpdate(region: AppInstallationParameters['region']) {
    setParameters({...parameters, region: region})
  }

  async function onTestConnection() {
    const token = parameters.graniittiToken;
    if (!token) {
      Notification.warning('Please set Frosmo Token first!');
      return;
    }

    const baseUrl = getBaseUrl(parameters.region);
    if (!baseUrl) {
      Notification.warning('Please select Frosmo Region first!');
      return;
    }

    if (!parameters.siteId) {
      Notification.warning('Please set Frosmo Site ID first!');
      return;
    }
    
    setTestConnectionLoading(true);
    
    const url = `${baseUrl}/sites/${parameters.siteId}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const site = await response.json() as FrosmoSite;
        Notification.success(`Connection to Frosmo was successful. Your site url is: ${site.url}`);
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
      }
    } catch (e) {
      Notification.error("Connection to Frosmo failed");
      return;
    }
    
    setTestConnectionLoading(false);
  }

  return (
    <Workbench className={css({ margin: '80px' })}>
      <Form>
        <Heading>Frosmo configuration</Heading>
        <img src="frosmo_logo.png" alt="Frosmo logo" width="150"></img>
        <Paragraph>Please set up the connection first before you can start using Frosmo in your content items.</Paragraph>

        <TextField
          name="token"
          id="token"
          labelText="Token"
          helpText="Please enter your Frosmo Token"
          required
          onChange={(event) => onTokenUpdate(event.target.value)}
          value={parameters.graniittiToken}
        />
        <HelpText><a href="https://docs.frosmo.com/display/dev/Graniitti+API+authentication">Learn more</a></HelpText>

        <SelectField
          name="region"
          id="region"
          labelText="Region"
          helpText="Please enter your Frosmo Region"
          // selectProps="large"
          onChange={(event) => onRegionUpdate(event.target.value as AppInstallationParameters['region'])}
          value={parameters.region}
        >
          <Option value="eu">EU</Option>
          <Option value="eu2">EU2</Option>
          <Option value="fi1">FI</Option>
          <Option value="us">US</Option>
          <Option value="asia">Asia</Option>
        </SelectField>

        <TextField
          name="site_id"
          id="site_id"
          labelText="Site ID"
          helpText="Please enter your Frosmo Site ID"
          required
          onChange={(event) => onSiteIdUpdate(Number(event.target.value))}
          value={parameters.siteId ? String(parameters.siteId) : ''}
        />

        <Button buttonType="primary" onClick={onTestConnection}>Test Connection</Button>
        {isTestConnectionLoading &&
        <div>
          Testing connection <Spinner />
        </div>
        }
        
        
        {/* <input type="number" onChange={(event) => onSiteIdUpdate(Number(event.target.value))} value={String(parameters.siteId)}></input> */}
      </Form>
    </Workbench>
  );
}

export default Config;
