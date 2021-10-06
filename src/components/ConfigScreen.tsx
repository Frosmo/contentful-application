import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { HelpText, Heading, Form, Workbench, Paragraph, TextField, SelectField, Option, Button, Spinner, Notification } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { Config as AppInstallationParameters, getBaseUrl, getSite, GraniittiError } from '../graniitti';

interface ConfigProps {
  sdk: AppExtensionSDK;
}

const Config = (props: ConfigProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({token: '', region: 'eu', siteId: 0});
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

  function onTokenUpdate(token: AppInstallationParameters['token']) {
    setParameters({...parameters, token})
  }
  
  function onSiteIdUpdate(siteId: AppInstallationParameters['siteId']) {
    setParameters({...parameters, siteId})
  }

  function onRegionUpdate(region: AppInstallationParameters['region']) {
    setParameters({...parameters, region})
  }

  async function onTestConnection() {
    const token = parameters.token;
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

    try {
      const site = await getSite(parameters);
      Notification.success(`Connection to Frosmo was successful. Your site url is: ${site.url}`);
    } catch (error) {
      if (error instanceof GraniittiError) {
        Notification.error(error.message);
      } else {
        Notification.error('Connection failed for unknown reason');
      }
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
          value={parameters.token}
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

        <Button buttonType="primary" onClick={onTestConnection} disabled={isTestConnectionLoading}>Test Connection</Button>
        {isTestConnectionLoading &&
        <div>
          Testing connection <Spinner />
        </div>
        }
      </Form>
    </Workbench>
  );
}

export default Config;
