polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  entitiesThatExistInMISP: Ember.computed.alias('details.entitiesThatExistInMISP'),
  notFoundEntities: Ember.computed.alias('details.notFoundEntities'),
  shouldPublish: false,
  distribution: 0,
  threatLevel: 1,
  analysis: 0,
  eventInfo: 'Polarity Bulk Attribute Creation',
  newIocs: [],
  newIocsToSubmit: [],
  selectedTags: [],
  deleteMessage: '',
  deleteErrorMessage: '',
  deleteIsRunning: false,
  isDeleting: false,
  entityToDelete: {},
  createMessage: '',
  createErrorMessage: '',
  createIsRunning: false,
  selectedTag: '',
  editingTags: false,
  interactionDisabled: Ember.computed('isDeleting', 'createIsRunning', function () {
    return this.get('isDeleting') || this.get('createIsRunning');
  }),
  init() {
    this.set('newIocs', this.get('notFoundEntities').slice(1));
    this.set('newIocsToSubmit', this.get('notFoundEntities').slice(0, 1));

    this.set('selectedTags', [
      this.get('details.polarityTag') || {
        name: 'Polarity',
        colour: '#5ecd1e',
        isNew: true
      }
    ]);
    this._super(...arguments);
  },
  actions: {
    initiateItemDeletion: function (entity) {
      this.set('isDeleting', true);
      this.set('entityToDelete', entity);
    },
    cancelItemDeletion: function () {
      this.set('isDeleting', false);
      this.set('entityToDelete', {});
    },
    confirmDelete: function () {
      const outerThis = this;
      outerThis.set('deleteMessage', '');
      outerThis.set('deleteErrorMessage', '');
      outerThis.set('deleteIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');

      outerThis
        .sendIntegrationMessage({
          data: {
            action: 'deleteItem',
            entity: outerThis.get('entityToDelete'),
            newIocs: outerThis.get('newIocs'),
            intelObjects: outerThis.get('entitiesThatExistInMISP')
          }
        })
        .then(({ newIocs, newList }) => {
          outerThis.set('newIocs', newIocs);
          outerThis.set('entitiesThatExistInMISP', newList);
          outerThis.set('deleteMessage', 'Successfully Deleted IOC');
        })
        .catch((err) => {
          outerThis.set(
            'deleteErrorMessage',
            'Failed to Delete IOC: ' +
              (err &&
                (err.detail || err.err || err.message || err.title || err.description)) ||
              'Unknown Reason'
          );
        })
        .finally(() => {
          this.set('isDeleting', false);
          this.set('entityToDelete', {});
          outerThis.set('deleteIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('deleteMessage', '');
            outerThis.set('deleteErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    },
    removeSubmitItem: function (entity) {
      this.set('newIocs', this.get('newIocs').concat(entity));
      this.set(
        'newIocsToSubmit',
        this.get('newIocsToSubmit').filter(({ value }) => value !== entity.value)
      );
      this.get('block').notifyPropertyChange('data');
    },
    addSubmitItem: function (entity) {
      this.set(
        'newIocs',
        this.get('newIocs').filter(({ value }) => value !== entity.value)
      );
      this.set('newIocsToSubmit', this.get('newIocsToSubmit').concat(entity));
      this.get('block').notifyPropertyChange('data');
    },
    submitItems: function () {
      const outerThis = this;
      const possibleParamErrors = [
        {
          condition: () => !outerThis.get('newIocsToSubmit').length,
          message: 'No Items to Submit...'
        }
      ];

      const paramErrorMessages = possibleParamErrors.reduce(
        (agg, possibleParamError) =>
          possibleParamError.condition() ? agg.concat(possibleParamError.message) : agg,
        []
      );

      if (paramErrorMessages.length) {
        outerThis.set('createErrorMessage', paramErrorMessages[0]);
        outerThis.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          outerThis.set('createErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');
        }, 5000);
        return;
      }

      outerThis.set('createMessage', '');
      outerThis.set('createErrorMessage', '');
      outerThis.set('createIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');
      outerThis
        .sendIntegrationMessage({
          data: {
            action: 'submitItems',
            newIocsToSubmit: outerThis.get('newIocsToSubmit'),
            previousEntitiesInMISP: outerThis.get('entitiesThatExistInMISP'),
            shouldPublish: outerThis.get('shouldPublish'),
            distribution: outerThis.get('distribution'),
            threatLevel: outerThis.get('threatLevel'),
            analysis: outerThis.get('analysis'),
            eventInfo: outerThis.get('eventInfo'),
            submitTags: outerThis.get('selectedTags')
          }
        })
        .then(({ entitiesThatExistInMISP,  }) => {
          outerThis.set('entitiesThatExistInMISP', entitiesThatExistInMISP);
          outerThis.set('newIocsToSubmit', []);
          outerThis.set('createMessage', 'Successfully Created IOCs');
        })
        .catch((err) => {
          outerThis.set(
            'createErrorMessage',
            'Failed to Create IOC: ' +
              (err && (err.message || err.title || err.description)) || 'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.set('createIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('createMessage', '');
            outerThis.set('createErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    },
    editTags: function () {
      this.toggleProperty(`editingTags`);
      this.get('block').notifyPropertyChange('data');
    },
    deleteTag: function (tagToDelete) {
      this.set(
        'selectedTags',
        this.get('selectedTags').filter(
          (selectedTag) => selectedTag.name !== tagToDelete.name
        )
      );
    },
    searchTags: function (term) {
      const outerThis = this;
      return new Ember.RSVP.Promise((resolve, reject) => {
        if (term) {
          const outerThis = this;
          outerThis.set('createMessage', '');
          outerThis.set('createErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');

          outerThis
            .sendIntegrationMessage({
              data: {
                action: 'searchTags',
                term,
                selectedTags: this.get('selectedTags')
              }
            })
            .then(({ tags }) => {
              resolve([{ name: term, colour: 'black', isNew: true }].concat(tags));
            })
            .catch((err) => {
              outerThis.set(
                'createErrorMessage',
                'Search Tags Failed: ' +
                  (err &&
                    (err.detail ||
                      err.err ||
                      err.message ||
                      err.title ||
                      err.description)) || 'Unknown Reason'
              );
            })
            .finally(() => {
              outerThis.get('block').notifyPropertyChange('data');
              setTimeout(() => {
                outerThis.set('createMessage', '');
                outerThis.set('createErrorMessage', '');
                outerThis.get('block').notifyPropertyChange('data');
              }, 5000);
            });
        } else {
          resolve();
        }
      });
    },
    addTag: function () {
      const selectedTag = this.get('selectedTag');
      const selectedTags = this.get('selectedTags');

      let isDuplicate = selectedTags.find(
        (tag) => tag.name.toLowerCase().trim() === selectedTag.name.toLowerCase().trim()
      );

      if (!isDuplicate) {
        this.set('selectedTags', selectedTags.concat(selectedTag));
      }
      this.set('selectedTag', '');
    }
  }
});
