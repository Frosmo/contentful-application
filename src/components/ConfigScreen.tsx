import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK, ContentType, CollectionResponse, EditorInterface } from '@contentful/app-sdk';
import { FormLabel, TextInput, HelpText, Heading, Form, Paragraph, Note, Select, SelectField, Spinner, Option } from '@contentful/forma-36-react-components';
import { Config as AppInstallationParameters } from '../graniitti';
import styles from './ConfigScreen.styles';
import { getSites, Site } from '../graniitti';
import { FieldSelector, CompatibleFields, SelectedFields } from './ConfigScreen/FieldSelector';
import { getCompatibleFields, editorInterfacesToSelectedFields, selectedFieldsToTargetState } from './ConfigScreen/fields';

interface ConfigProps {
  sdk: AppExtensionSDK;
}

const Config = (props: ConfigProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({ token: '', region: 'eu', siteId: 0 });
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState<boolean>(false)
  const [compatibleFields, setCompatibleFields] = useState<CompatibleFields>({})
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({})

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    // const currentState = await props.sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  }, [parameters, contentTypes, selectedFields]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => onConfigure());
  }, [props.sdk, onConfigure]);

  const getAndSetContentTypeSelections = useCallback(async () => {
    const { space, ids } = props.sdk;

    const contentTypesResponse = await space.getContentTypes();
    const allContentTypes = (contentTypesResponse as CollectionResponse<ContentType>).items;
    const allCompatibleFields = getCompatibleFields(allContentTypes);
    setCompatibleFields(allCompatibleFields);

    const filteredContentTypes = allContentTypes.filter((ct) => {
      const fields = allCompatibleFields[ct.sys.id];
      return fields && fields.length > 0;
    });
    setContentTypes(filteredContentTypes)

    const eisResponse = await space.getEditorInterfaces();
    const editorInterfaces = (eisResponse as CollectionResponse<EditorInterface>).items;
    const currentSelectedFields = editorInterfacesToSelectedFields(editorInterfaces, ids.app);
    setSelectedFields(currentSelectedFields);

  }, [props.sdk]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await props.sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      await getAndSetContentTypeSelections();

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      props.sdk.app.setReady();
    })()
  }, [props.sdk, getAndSetContentTypeSelections])

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

  function renderSites() {
    return sites.map(site => (<Option value={String(site.id)} key={site.id}>{site.url}</Option>))
  }

  function onSelectedFieldsChange (newSelectedFields: SelectedFields) {
    setSelectedFields(newSelectedFields);
  };

  return (
    <>
      <div className={styles.background} />
      <div className={styles.body}>
        <Form>
          <Heading>Frosmo app configuration</Heading>

          <>
            <FormLabel htmlFor="token">API token</FormLabel>
            <TextInput
              id="token"
              name="token"
              type="text"
              required
              onChange={(event) => onTokenUpdate(event.target.value)}
              value={parameters.token}
            />
            <HelpText className={styles.helpText}>
              Enter your personal access token for the Frosmo Graniitti API.{' '}
              <a href="https://docs.frosmo.com/x/MpU5AQ" target="_blank" rel="noreferrer">Learn more</a>
            </HelpText>
          </>

          <>
            <SelectField
              id="region"
              name="region"
              labelText="Region"
              onChange={(event) => onRegionUpdate(event.target.value as AppInstallationParameters['region'])}
              value={parameters.region}
            >
              <Option value="asia" key="asia">Asia</Option>
              <Option value="eu" key="eu">EU</Option>
              <Option value="eu2" key="eu2">EU2</Option>
              <Option value="fi1" key="fi1">FI1</Option>
              <Option value="us" key="us">US</Option>
            </SelectField>
            <HelpText className={styles.helpText}>
              Select your Frosmo Platform region.{' '}
              <a href="https://docs.frosmo.com/x/Mw0R#Frequentlyaskedquestions-Siteandcompanyinformation" target="_blank" rel="noreferrer">Learn more</a>
            </HelpText>
          </>

          <>
            <FormLabel htmlFor="site_id">Site</FormLabel>
            {sitesLoading && <Paragraph><Spinner /></Paragraph>}
            {!sitesLoading && sites.length === 0 &&
                <Note>
                  The API token or region is not set correctly. Enter a valid token and select the correct region for your site.
                </Note>
            }
            {!sitesLoading && sites.length > 0 &&
              <>
                <Select
                  id="site_id"
                  name="site_id"
                  onChange={(event) => onSiteIdUpdate(Number(event.target.value))}
                  value={String(parameters.siteId)}
                >
                  {renderSites()}
                </Select>
                <HelpText className={styles.helpText}>
                  Select your site.
                </HelpText>
              </>
            }
          </>
        </Form>
        <hr />
        <>
          <Heading>Assign to fields</Heading>
          <FieldSelector
            contentTypes={contentTypes}
            compatibleFields={compatibleFields}
            selectedFields={selectedFields}
            onSelectedFieldsChange={onSelectedFieldsChange} >
          </FieldSelector>
        </>
      </div>

      <div className={styles.logo}>
        <img src="frosmo_logo.png" alt="Frosmo logo" width="100" />
      </div>
    </>
  );
}

export default Config;
