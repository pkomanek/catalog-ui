import React from 'react';
import PropTypes from 'prop-types';
import { InternalSelect } from '@data-driven-forms/pf4-component-mapper/dist/cjs/select';
import { Grid, GridItem } from '@patternfly/react-core';
import asyncFormValidator from '../../utilities/async-form-validator';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-field-api';

export const ShareGroupSelect = ({
  inputName,
  selectName,
  loadOptions,
  permissions
}) => {
  const inputProps = useFieldApi({ name: inputName });
  const selectProps = useFieldApi({ name: selectName });

  return (
    <Grid gutter="md" className="share-column">
      <GridItem span={7}>
        <InternalSelect
          isSearchable
          isClearable
          menuIsPortal
          loadOptions={asyncFormValidator(loadOptions)}
          placeholder="Select group"
          isValid={!(inputProps?.meta?.error && inputProps.meta.touched)}
          {...inputProps}
          {...inputProps.input}
        />
        {inputProps?.meta?.error && inputProps.meta.touched && (
          <div
            className="pf-c-form__helper-text pf-m-error"
            id="permission-helper"
            aria-live="polite"
          >
            {selectProps.meta.error}
          </div>
        )}
      </GridItem>
      <GridItem span={5}>
        <InternalSelect
          options={permissions}
          menuIsPortal
          placeholder="Select permission"
          isValid={!(selectProps?.meta?.error && selectProps.meta.touched)}
          {...selectProps}
          {...selectProps.input}
        />
        {selectProps?.meta?.error && selectProps.meta.touched && (
          <div
            className="pf-c-form__helper-text pf-m-error"
            id="permission-helper"
            aria-live="polite"
          >
            {selectProps.meta.error}
          </div>
        )}
      </GridItem>
    </Grid>
  );
};

ShareGroupSelect.propTypes = {
  inputName: PropTypes.string.isRequired,
  selectName: PropTypes.string.isRequired,
  loadOptions: PropTypes.func.isRequired,
  permissions: PropTypes.any
};

export default ShareGroupSelect;
