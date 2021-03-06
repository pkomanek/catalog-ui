import React, { useEffect, useReducer, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useRouteMatch, Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import { scrollToTop } from '../../helpers/shared/helpers';
import { toggleArraySelection } from '../../helpers/shared/redux-mutators';
import { fetchPlatforms } from '../../redux/actions/platform-actions';
import {
  copyPortfolio,
  fetchPortfolios,
  fetchSelectedPortfolio,
  removeProductsFromPortfolio,
  resetSelectedPortfolio,
  fetchPortfolioItemsWithPortfolio
} from '../../redux/actions/portfolio-actions';
import asyncFormValidator from '../../utilities/async-form-validator';
import useQuery from '../../utilities/use-query';
import useBreadcrumbs from '../../utilities/use-breadcrumbs';
import { PORTFOLIO_ROUTE } from '../../constants/routes';
import { UnauthorizedRedirect } from '../error-pages/error-redirects';
import CatalogRoute from '../../routing/catalog-route';
import useIsMounted from '../../utilities/use-is-mounted';
import useInitialUriHash from '../../routing/use-initial-uri-hash';
import ToolbarRenderer from '../../toolbar/toolbar-renderer';
import { toolbarComponentTypes } from '../../toolbar/toolbar-mapper';

/**
 * Fake the toolbar until the chunk is loaded
 */
const PortfolioSuspenseFallback = ({ title, description }) => (
  <ToolbarRenderer
    schema={{
      fields: [
        {
          component: toolbarComponentTypes.TOP_TOOLBAR,
          key: 'portfolio-top-toolbar',
          fields: [
            {
              component: toolbarComponentTypes.TOP_TOOLBAR_TITLE,
              key: 'portfolio-toolbar-title',
              title,
              description
            }
          ]
        }
      ]
    }}
  />
);

PortfolioSuspenseFallback.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node
};

const PortfolioItems = lazy(() =>
  /* webpackChunkName: "portfolio-items" */ import('./portfolio-items')
);

const PortfolioItemDetail = lazy(() =>
  import(
    /* webpackChunkName: "portfolio-item-detail" */
    './portfolio-item-detail/portfolio-item-detail'
  )
);
const AddProductsToPortfolio = lazy(() =>
  import(
    /* webpackChunkName: "add-products-to-portfolio" */
    './add-products-to-portfolio'
  )
);
const initialState = {
  selectedItems: [],
  removeInProgress: false,
  filterValue: '',
  copyInProgress: false,
  isFetching: true,
  isFiltering: false
};

const debouncedFilter = asyncFormValidator(
  (value, dispatch, filteringCallback, meta) => {
    filteringCallback(true);
    dispatch(fetchPortfolioItemsWithPortfolio(value, meta)).then(() =>
      filteringCallback(false)
    );
  },
  1000
);

const porftolioUiReducer = (state, { type, payload }) =>
  ({
    selectItem: {
      ...state,
      selectedItems: toggleArraySelection(state.selectedItems, payload)
    },
    setRemoveInProgress: { ...state, removeInProgress: payload },
    removeSucessfull: { ...state, selectedItems: [], removeInProgress: false },
    setFilterValue: { ...state, filterValue: payload, isFiltering: true },
    setCopyInProgress: { ...state, copyInProgress: payload },
    setIsFetching: { ...state, isFetching: payload },
    setFilteringFlag: { ...state, isFiltering: payload }
  }[type]);

const Portfolio = () => {
  const viewState = useInitialUriHash();
  const [state, stateDispatch] = useReducer(porftolioUiReducer, {
    ...initialState,
    filterValue: viewState?.portfolioItems?.filter || ''
  });
  const [searchParams] = useQuery(['portfolio']);
  const { portfolio: id } = searchParams;
  const { url } = useRouteMatch(PORTFOLIO_ROUTE);
  const history = useHistory();
  const dispatch = useDispatch();
  const isMounted = useIsMounted();
  const { portfolio, portfolioItem, meta } = useSelector(
    ({
      portfolioReducer: {
        selectedPortfolio,
        portfolioItem,
        portfolioItems: { meta }
      }
    }) => ({
      portfolio: selectedPortfolio,
      portfolioItem,
      meta
    })
  );

  const resetBreadcrumbs = useBreadcrumbs([portfolio, portfolioItem]);

  const fetchData = (portfolioId) => {
    stateDispatch({ type: 'setIsFetching', payload: true });
    return Promise.all([
      dispatch(fetchPlatforms()),
      dispatch(fetchSelectedPortfolio(portfolioId)),
      dispatch(
        fetchPortfolioItemsWithPortfolio(portfolioId, viewState?.portfolioItems)
      )
    ])
      .then((data) => {
        if (isMounted.current) {
          stateDispatch({ type: 'setIsFetching', payload: false });
        }

        return data;
      })
      .catch(() => stateDispatch({ type: 'setIsFetching', payload: false }));
  };

  useEffect(() => {
    insights.chrome.appNavClick({ id: 'portfolios', secondaryNav: true });
    fetchData(id);
    scrollToTop();

    return () => {
      resetBreadcrumbs();
      dispatch(resetSelectedPortfolio());
    };
  }, []);

  useEffect(() => {
    if (
      isMounted.current === true &&
      !state.isFetching &&
      history.location.pathname === PORTFOLIO_ROUTE
    ) {
      fetchData(id);
      scrollToTop();
    }
  }, [id, history.location.pathname]);

  const handleCopyPortfolio = () => {
    stateDispatch({ type: 'setCopyInProgress', payload: true });
    return dispatch(copyPortfolio(id))
      .then(({ id }) =>
        history.push({
          pathname: PORTFOLIO_ROUTE,
          search: `?portfolio=${id}`
        })
      )
      .then(() => stateDispatch({ type: 'setCopyInProgress', payload: false }))
      .then(() => dispatch(fetchPortfolios()))
      .catch(() =>
        stateDispatch({ type: 'setCopyInProgress', payload: false })
      );
  };

  const removeProducts = (products) => {
    stateDispatch({ type: 'setRemoveInProgress', payload: true });
    dispatch(removeProductsFromPortfolio(products, portfolio.name))
      .then(() => stateDispatch({ type: 'removeSucessfull' }))
      .catch(() =>
        stateDispatch({ type: 'setRemoveInProgress', payload: false })
      );
  };

  const handleFilterChange = (filter) => {
    stateDispatch({ type: 'setFilterValue', payload: filter });
    debouncedFilter(
      id,
      dispatch,
      (isFiltering) =>
        stateDispatch({ type: 'setFilteringFlag', payload: isFiltering }),
      {
        ...meta,
        offset: 0,
        filter
      }
    );
  };

  const routes = {
    portfolioRoute: url,
    addProductsRoute: `${url}/add-products`,
    editPortfolioRoute: `${url}/edit-portfolio`,
    removePortfolioRoute: `${url}/remove-portfolio`,
    sharePortfolioRoute: `${url}/share-portfolio`,
    workflowPortfolioRoute: `${url}/edit-workflow`,
    portfolioItemRoute: `${url}/portfolio-item`
  };

  if (portfolio.metadata.user_capabilities.show === false) {
    return <UnauthorizedRedirect />;
  }

  return (
    <Suspense
      fallback={
        <PortfolioSuspenseFallback
          title={portfolio.name}
          description={portfolio.description}
        />
      }
    >
      <Switch>
        <CatalogRoute
          path={routes.addProductsRoute}
          userCapabilities={portfolio.metadata.user_capabilities}
          requiredCapabilities="update"
        >
          <AddProductsToPortfolio portfolioRoute={routes.portfolioRoute} />
        </CatalogRoute>
        <Route path={routes.portfolioItemRoute}>
          <PortfolioItemDetail portfolioLoaded={!state.isFetching} />
        </Route>
        <Route path={routes.portfolioRoute}>
          <PortfolioItems
            routes={routes}
            handleFilterChange={handleFilterChange}
            removeProducts={removeProducts}
            copyPortfolio={handleCopyPortfolio}
            state={state}
            stateDispatch={stateDispatch}
          />
        </Route>
      </Switch>
    </Suspense>
  );
};

export default Portfolio;
