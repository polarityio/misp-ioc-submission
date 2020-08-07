# Polarity MISP Integration

The Polarity MISP integration allows Polarity to search your instance of MISP to return valid information about domains, IPs, and hashes.  The integration also allows you to add and remove IOC in bulk.


## MISP Integration Options

### MISP URL

URL of your MISP instance to include the schema (i.e., https://) and port if applicable

```
https://my-misp-server.internal
```

### API Key

The authentication of the automation is performed via a secure key available in the MISP UI interface. Make sure you keep that key secret as it gives access to the entire database! The API key is available in the event actions menu under automation

### Enable Adding Tags

If checked, users can add tags to an event from the Overlay Window

> Note that we recommend setting this option as an admin only option so the value is consistent across all your users.

### Enable Removing Tags

If checked, users can remove tags from an event from the Overlay Window

> Note that we recommend setting this option as an admin only option so the value is consistent across all your users.


## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
