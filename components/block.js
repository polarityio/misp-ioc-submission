polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  maxUniqueKeyNumber: Ember.computed.alias('details.maxUniqueKeyNumber'),
  attributeCategory: 'Network activity',
  attributeType: 'ip-src',
  eventInfo: '',
  distribution: 0,
  threatLevel: 1,
  analysis: 0,
  shouldPublish: false,
  submitNewEvent: false,
  categoriesAndTypes: {},
  entitiesThatExistInMISP: [],
  newIocs: [],
  newIocsToSubmit: [],
  selectedTags: [],
  selectedEvent: '',
  deleteMessage: '',
  deleteErrorMessage: '',
  deleteIsRunning: false,
  isDeleting: false,
  showCategorySubmitDisabledMessage: false,
  entityToDelete: {},
  createMessage: '',
  createErrorMessage: '',
  createIsRunning: false,
  selectedTag: [],
  foundEvents: [],
  editingTags: false,
  categorySubmitDisabled: false,
  interactionDisabled: Ember.computed('isDeleting', 'createIsRunning', function () {
    const interactionDisabled = this.get('isDeleting') || this.get('createIsRunning');

    this.updateCategorySubmitDisabled(this.get('newIocsToSubmit'), interactionDisabled);

    return interactionDisabled;
  }),
  init() {
    this.set(
      'newIocs',
      this.get(`details.notFoundEntities${this.get('maxUniqueKeyNumber')}`)
    );

    this.set(
      'entitiesThatExistInMISP',
      this.get(`details.entitiesThatExistInMISP${this.get('maxUniqueKeyNumber')}`)
    );

    const categoriesAndTypes = this.get(
      `details.categoriesAndTypes${this.get('maxUniqueKeyNumber')}`
    );
    this.set(
      'categoriesAndTypes',
      Object.assign({}, categoriesAndTypes, {
        categories: categoriesAndTypes.categories.sort((category) =>
          category === 'Network activity' ? -1 : 1
        ),
        types: categoriesAndTypes.category_type_mappings[
          'Network activity'
        ].sort((type) => (type === 'ip-src' ? -1 : 1))
      })
    );

    this.set('selectedTags', [
      this.get('details.polarityTag') || {
        name: 'Submitted_By_Polarity',
        colour: '#5ecd1e',
        isNew: true
      }
    ]);

    this._super(...arguments);
  },
  observer: Ember.on(
    'willUpdate',
    Ember.observer('details.maxUniqueKeyNumber', function () {
      if (this.get('maxUniqueKeyNumber') !== this.get('_maxUniqueKeyNumber')) {
        this.set('_maxUniqueKeyNumber', this.get('maxUniqueKeyNumber'));

        this.set(
          'newIocs',
          this.get(`details.notFoundEntities${this.get('maxUniqueKeyNumber')}`)
        );

        this.set(
          'entitiesThatExistInMISP',
          this.get(`details.entitiesThatExistInMISP${this.get('maxUniqueKeyNumber')}`)
        );

        const categoriesAndTypes = this.get(
          `details.categoriesAndTypes${this.get('maxUniqueKeyNumber')}`
        );
        this.set(
          'categoriesAndTypes',
          Object.assign({}, categoriesAndTypes, {
            categories: categoriesAndTypes.categories.sort((category) =>
              category === 'Network activity' ? -1 : 1
            ),
            types: categoriesAndTypes.category_type_mappings[
              'Network activity'
            ].sort((type) => (type === 'ip-src' ? -1 : 1))
          })
        );

        this.set('newIocsToSubmit', []);
      }
    })
  ),
  searchTags: function (term, resolve, reject) {
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
        outerThis.set(
          'existingTags',
          [
            ...(term
              ? [
                  {
                    name: term,
                    colour: '#5ecd1e',
                    font_color: '#fff',
                    isNew: true
                  }
                ]
              : [])
          ].concat(tags)
        );
      })
      .catch((err) => {
        outerThis.set(
          'createErrorMessage',
          'Search Tags Failed: ' +
            (err &&
              (err.detail || err.err || err.message || err.title || err.description)) ||
            'Unknown Reason'
        );
      })
      .finally(() => {
        outerThis.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          outerThis.set('createMessage', '');
          outerThis.set('createErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');
        }, 5000);
        resolve();
      });
  },
  searchEvents: function (term, resolve, reject) {
    const outerThis = this;
    outerThis.set('createMessage', '');
    outerThis.set('createErrorMessage', '');
    outerThis.get('block').notifyPropertyChange('data');

    outerThis
      .sendIntegrationMessage({
        data: {
          action: 'searchEvents',
          selectedEvent: outerThis.get('selectedEvent'),
          term
        }
      })
      .then(({ events }) => {
        outerThis.set('foundEvents', events);
      })
      .catch((err) => {
        outerThis.set(
          'createErrorMessage',
          'Search Events Failed: ' +
            (err &&
              (err.detail || err.err || err.message || err.title || err.description)) ||
            'Unknown Reason'
        );
      })
      .finally(() => {
        outerThis.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          outerThis.set('createMessage', '');
          outerThis.set('createErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');
        }, 5000);
        resolve();
      });
  },
  updateCategorySubmitDisabled: function (newIocsToSubmit, interactionDisabled) {
    const categorySubmitDisabled =
      newIocsToSubmit.some(({ type }, i, self) =>
        self.some(({ type: _type }) => type !== _type)
      ) || interactionDisabled;

    this.changeCategoryTypeToDefaultsAndBack(categorySubmitDisabled);

    this.set('categorySubmitDisabled', categorySubmitDisabled);
    this.get('block').notifyPropertyChange('data');
  },
  changeCategoryTypeToDefaultsAndBack: function (categorySubmitDisabled) {
    if (!this.get('_categorySubmitDisabled') && categorySubmitDisabled) {
      this.set('_categoriesAndTypes', this.get('categoriesAndTypes'));
      this.set('_attributeCategory', this.get('attributeCategory'));
      this.set('_attributeType', this.get('attributeType'));
      this.set('_categorySubmitDisabled', categorySubmitDisabled);
      this.get('block').notifyPropertyChange('data');

      this.set('categoriesAndTypes', {
        categories: ['Network activity'],
        types: ['ip-src']
      });
      this.set('attributeCategory', '');
      this.set('attributeType', '');
    } else if (this.get('_categorySubmitDisabled') && !categorySubmitDisabled) {
      this.set('_categorySubmitDisabled', categorySubmitDisabled);
      this.set('categoriesAndTypes', this.get('_categoriesAndTypes'));
      this.set('attributeCategory', this.get('_attributeCategory'));
      this.set('attributeType', this.get('_attributeType'));
    }
  },
  actions: {
    toggleCategorySubmitDisabledMessage: function () {
      this.toggleProperty('showCategorySubmitDisabledMessage');
    },
    updateAttributeCategory: function (category) {
      this.set('attributeCategory', category);
      const categoriesAndTypes = this.get('categoriesAndTypes');
      this.set(
        'categoriesAndTypes',
        Object.assign({}, categoriesAndTypes, {
          types: categoriesAndTypes.category_type_mappings[category].sort((type) =>
            type.includes('ip') ? -1 : 1
          )
        })
      );
    },
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
    removeAllSubmitItems: function () {
      const allIOCs = this.get('newIocs').concat(this.get('newIocsToSubmit'));

      this.set('newIocs', allIOCs);
      this.set('newIocsToSubmit', []);

      this.updateCategorySubmitDisabled([]);
      this.get('block').notifyPropertyChange('data');
    },
    addAllSubmitItems: function () {
      const allIOCs = this.get('newIocs').concat(this.get('newIocsToSubmit'));

      this.set('newIocs', []);
      this.set('newIocsToSubmit', allIOCs);

      this.updateCategorySubmitDisabled(allIOCs);
      this.get('block').notifyPropertyChange('data');
    },
    removeSubmitItem: function (entity) {
      this.set('newIocs', this.get('newIocs').concat(entity));

      const updatedNewIocsToSubmit = this.get('newIocsToSubmit').filter(
        ({ value }) => value !== entity.value
      );
      this.set('newIocsToSubmit', updatedNewIocsToSubmit);
      this.updateCategorySubmitDisabled(updatedNewIocsToSubmit);

      this.get('block').notifyPropertyChange('data');
    },
    addSubmitItem: function (entity) {
      this.set(
        'newIocs',
        this.get('newIocs').filter(({ value }) => value !== entity.value)
      );
      const updatedNewIocsToSubmit = this.get('newIocsToSubmit').concat(entity);

      this.set('newIocsToSubmit', updatedNewIocsToSubmit);

      this.updateCategorySubmitDisabled(updatedNewIocsToSubmit);

      this.get('block').notifyPropertyChange('data');
    },
    submitItems: function () {
      const outerThis = this;
      const possibleParamErrors = [
        {
          condition: () => !outerThis.get('newIocsToSubmit').length,
          message: 'No Items to Submit...'
        },
        {
          condition: () =>
            outerThis.get('submitNewEvent')
              ? !outerThis.get('eventInfo')
              : !outerThis.get('selectedEvent'),
          message: 'Event Info Required...'
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
            submitTags: outerThis.get('selectedTags'),
            attributeCategory: outerThis.get('attributeCategory'),
            attributeType: outerThis.get('attributeType'),
            submitNewEvent: outerThis.get('submitNewEvent'),
            selectedEvent: outerThis.get('selectedEvent')
          }
        })
        .then(({ entitiesThatExistInMISP }) => {
          outerThis.set('entitiesThatExistInMISP', entitiesThatExistInMISP);
          outerThis.set('newIocsToSubmit', []);
          outerThis.set('createMessage', 'Successfully Created IOCs');
        })
        .catch((err) => {
          outerThis.set(
            'createErrorMessage',
            'Failed to Create IOC: ' +
              (err && (err.detail || err.message || err.title || err.description)) ||
              'Unknown Reason'
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
      return new Ember.RSVP.Promise((resolve, reject) => {
        Ember.run.debounce(this, this.searchTags, term, resolve, reject, 500);
      });
    },
    searchEvents: function (term) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        Ember.run.debounce(this, this.searchEvents, term, resolve, reject, 500);
      });
    },
    updateSelectedEvent: function (value) {
      console.log(value);
      this.set('selectedEvent', value.target.value);
    },
    addTags: function (tags) {
      const selectedTag = this.get('selectedTag');
      const selectedTags = this.get('selectedTags');

      this.set('createMessage', '');

      let newSelectedTags = selectedTag.filter(
        (tag) =>
          !selectedTags.some(
            (selectedTag) =>
              tag.name.toLowerCase().trim() === selectedTag.name.toLowerCase().trim()
          )
      );

      this.set('selectedTags', selectedTags.concat(newSelectedTags));
      this.set('selectedTag', []);
      this.set('editingTags', false);
    }
  }
});
