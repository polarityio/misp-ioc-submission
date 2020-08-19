# Polarity MISP Integration

The Polarity MISP integration allows Polarity to search your instance of MISP to return found domains, IPs, and hashes.  The integration also allows you to add and remove IOCs in bulk.


## MISP Integration Options

### MISP URL

URL of your MISP instance to include the schema (i.e., https://) and port if applicable

```
https://my-misp-server.internal
```

### Authentication Key

The authentication of the automation is performed via a secure key available in the MISP UI interface. Make sure you keep that key secret as it gives access to the entire database!

### Allow IOC Deletion

If checked, users will be able to delete an Attribute from MISP. (this setting must be set to `User can view only`.


## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
