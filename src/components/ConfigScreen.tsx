import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { FormLabel, TextInput, HelpText, Heading, Form, Paragraph, Note, Select, SelectField, Spinner, Option, Button, Notification } from '@contentful/forma-36-react-components';
import { Config as AppInstallationParameters, getBaseUrl, getSite, GraniittiError } from '../graniitti';
import styles from './ConfigScreen.styles';
import { getSites, Site } from '../graniitti';

interface ConfigProps {
  sdk: AppExtensionSDK;
}

const Config = (props: ConfigProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({ token: '', region: 'eu', siteId: 0 });
  const [isTestConnectionLoading, setTestConnectionLoading] = useState<boolean>(false);
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState<boolean>(false)

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

  const fetchSites = useCallback(async () => {
    setSitesLoading(true);
    try {
      const sites = await getSites(parameters);
      setSites(sites);
    } catch (error) {
      setSites([]);
    }
    setSitesLoading(false);
  }, [parameters]);

  useEffect(() => {
    if (parameters.token && parameters.region) {
      fetchSites();
    } else {
      setSites([]);
    }
  }, [parameters, fetchSites]);

  function onTokenUpdate(token: AppInstallationParameters['token']) {
    setParameters({ ...parameters, token });
  }

  function onSiteIdUpdate(siteId: AppInstallationParameters['siteId']) {
    setParameters({ ...parameters, siteId });
  }

  function onRegionUpdate(region: AppInstallationParameters['region']) {
    setParameters({ ...parameters, region });
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

  function renderSites() {
    return sites.map(site => (<Option value={String(site.id)}>{site.url}</Option>))
  }

  return (
    <>
      <div className={styles.background} />
      <div className={styles.body}>
        <Form>
          <Heading>Frosmo configuration</Heading>

          <Paragraph>Please set up the connection first before you can start using Frosmo in your content items.</Paragraph>

          <>
            <FormLabel htmlFor="token">Token</FormLabel>
            <TextInput
              id="token"
              name="token"
              type="text"
              required
              onChange={(event) => onTokenUpdate(event.target.value)}
              value={parameters.token}
            />
            <HelpText>
              Please enter your Frosmo Token{' '}
              <a href="https://docs.frosmo.com/display/dev/Graniitti+API+authentication" target="_blank" rel="noreferrer">Learn more</a>
            </HelpText>
          </>

          <SelectField
            name="region"
            id="region"
            labelText="Frosmo Control Panel domain"
            helpText="Please select your Frosmo Control Panel domain"
            onChange={(event) => onRegionUpdate(event.target.value as AppInstallationParameters['region'])}
            value={parameters.region}
          >
            <Option value="eu">https://admin.inpref.com</Option>
            <Option value="eu2">https://admin.eu2.frosmo.com</Option>
            <Option value="fi1">https://admin.fi1.frosmo.com</Option>
            <Option value="us">https://admin.us.frosmo.com</Option>
            <Option value="asia">https://admin.asia.frosmo.com</Option>
          </SelectField>

          <>
            <FormLabel htmlFor="site_id">Select a site</FormLabel>
            {sitesLoading && <Paragraph><Spinner /></Paragraph>}
            {!sitesLoading && sites.length === 0 &&
              <Paragraph>
                <Note>
                  Token or Frosmo Control Panel domain is not set correctly.
                  Please set the token and select the correct Frosmo Control Panel domain.
                </Note>
              </Paragraph>
            }
            {!sitesLoading && sites.length > 0 &&
              <>
                <Select
                  name="site_id"
                  id="site_id"
                  onChange={(event) => onSiteIdUpdate(Number(event.target.value))}
                  value={String(parameters.siteId)}
                >
                  {renderSites()}
                </Select>

                <HelpText>
                  Please select your site.
              </HelpText>
              </>
            }
          </>

          <Button buttonType="primary" onClick={onTestConnection} disabled={isTestConnectionLoading} loading={isTestConnectionLoading}>Verify Connection</Button>
        </Form>
      </div>

      <div className={styles.logo}>
        <img src="frosmo_logo.png" alt="Frosmo logo" width="100" />
      </div>
    </>
  );
}

export default Config;
