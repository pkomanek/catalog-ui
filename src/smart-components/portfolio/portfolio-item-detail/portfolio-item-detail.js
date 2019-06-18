import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter, Route } from 'react-router-dom';
import { Grid, GridItem } from '@patternfly/react-core';
import { Section } from '@redhat-cloud-services/frontend-components';

import OrderModal from '../../common/order-modal';
import ItemDetailInfoBar from './item-detail-info-bar';
import { allowNull } from '../../../helpers/shared/helpers';
import ItemDetailDescription from './item-detail-description';
import CopyPortfolioItemModal from './copy-portfolio-item-modal';
import { fetchPlatforms } from '../../../redux/actions/platform-actions';
import { fetchWorkflows } from '../../../redux/actions/approval-actions';
import PortfolioItemDetailToolbar from './portfolio-item-detail-toolbar';
import TopToolbar from '../../../presentational-components/shared/top-toolbar';
import { updatePortfolioItem } from '../../../helpers/portfolio/portfolio-helper';
import { fetchPortfolioItem, selectPortfolioItem } from '../../../redux/actions/portfolio-actions';
import { ProductLoaderPlaceholder } from '../../../presentational-components/shared/loader-placeholders';

const PortfolioItemDetail = ({
  match: { path, url, params: { portfolioItemId }},
  history: { push },
  source,
  product,
  portfolio,
  isLoading,
  workflows,
  orderFetching,
  fetchWorkflows,
  fetchPlatforms,
  fetchPortfolioItem,
  selectPortfolioItem
}) => {
  const [ isOpen, setOpen ] = useState(false);
  const [ workflow, setWorkflow ] = useState(product.workflow_ref);
  useEffect(() => {
    fetchWorkflows();
  }, []);
  useEffect(() => {
    fetchPlatforms();
    fetchPortfolioItem(portfolioItemId);
  }, [ path ]);

  useEffect(() => {
    setWorkflow(product.workflow_ref);
  }, [ isLoading ]);

  const handleUpdate = () => updatePortfolioItem({ ...product, workflow_ref: workflow })
  .then(updatedItem => selectPortfolioItem(updatedItem))
  .then(() => push(url));

  if (isLoading) {
    return (
      <Section style={ { backgroundColor: 'white', minHeight: '100%' } }>
        <TopToolbar>
          <ProductLoaderPlaceholder />
        </TopToolbar>
      </Section>
    );
  }

  return (
    <Section style={ { backgroundColor: 'white', minHeight: '100%' } }>
      <Route path={ `${url}/order` } render={ props => <OrderModal { ...props } closeUrl={ url } serviceData={ product }/> }/>
      <Route
        path={ `${url}/copy` }
        render={ props => (
          <CopyPortfolioItemModal { ...props }  portfolioItemId={ product.id } portfolioId={ portfolio.id } closeUrl={ url }/>
        ) }
      />
      <PortfolioItemDetailToolbar
        url={ url }
        isOpen={ isOpen }
        product={ product }
        setOpen={ setOpen }
        handleUpdate={ handleUpdate }
        setWorkflow={ setWorkflow }
        isFetching={ orderFetching }
      />
      <div style={ { padding: 32 } }>
        <Grid>
          <GridItem md={ 2 }>
            <ItemDetailInfoBar product={ product } portfolio={ portfolio } source={ source } />
          </GridItem>
          <GridItem md={ 10 }>
            <ItemDetailDescription product={ product } url={ url } workflows={ workflows } workflow={ workflow } setWorkflow={ setWorkflow }  />
          </GridItem>
        </Grid>
      </div>
    </Section>
  );
};

PortfolioItemDetail.propTypes = {
  match: PropTypes.shape({
    path: PropTypes.string.isRequired
  }).isRequired,
  portfolio: PropTypes.shape({
    id: PropTypes.string.isRequired
  }),
  product: PropTypes.shape({
    id: PropTypes.string
  }).isRequired,
  source: PropTypes.object,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  workflows: PropTypes.arrayOf(PropTypes.shape({
    value: allowNull(PropTypes.string),
    label: PropTypes.string.isRequired
  })).isRequired,
  isLoading: PropTypes.bool,
  fetchPlatforms: PropTypes.func.isRequired,
  fetchPortfolioItem: PropTypes.func.isRequired,
  fetchWorkflows: PropTypes.func.isRequired,
  selectPortfolioItem: PropTypes.func.isRequired,
  orderFetching: PropTypes.bool
};

const mapStateToProps = ({
  portfolioReducer: { portfolioItem, isLoading, selectedPortfolio },
  platformReducer: { platforms },
  approvalReducer: { workflows, isFetching },
  orderReducer: { isLoading: orderFetching }
}) => {
  const portfolio = selectedPortfolio;
  const product = portfolioItem;
  let source;

  if (product && platforms) {
    source = platforms.find(item => item.id == product.service_offering_source_ref); // eslint-disable-line eqeqeq
  }

  return ({
    isLoading: isLoading || !product || !portfolio || !source || isFetching,
    workflows,
    portfolio,
    product,
    source,
    orderFetching
  });
};

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchPlatforms,
  fetchPortfolioItem,
  fetchWorkflows,
  selectPortfolioItem
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PortfolioItemDetail));
