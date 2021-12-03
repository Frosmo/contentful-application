import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px'
  }),
  background: css({
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    top: '0',
    width: '100%',
    height: '300px',
    backgroundColor: 'rgba(251,153,0,1.00)'
  }),
  logo: css({
    display: 'flex',
    justifyContent: 'center',
    margin: `${tokens.spacing2Xl} 0 ${tokens.spacing4Xl}`
  }),
  helpText: css({
    marginTop: tokens.spacingXs,
  })
};

export default styles