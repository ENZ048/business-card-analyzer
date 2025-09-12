import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../lib/api';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  plans: [],
  currentPlan: null,
  usage: null,
  isLoading: false,
  error: null
};

// Action types
const PLAN_ACTIONS = {
  FETCH_PLANS_START: 'FETCH_PLANS_START',
  FETCH_PLANS_SUCCESS: 'FETCH_PLANS_SUCCESS',
  FETCH_PLANS_FAILURE: 'FETCH_PLANS_FAILURE',
  FETCH_CURRENT_PLAN_START: 'FETCH_CURRENT_PLAN_START',
  FETCH_CURRENT_PLAN_SUCCESS: 'FETCH_CURRENT_PLAN_SUCCESS',
  FETCH_CURRENT_PLAN_FAILURE: 'FETCH_CURRENT_PLAN_FAILURE',
  UPGRADE_PLAN_START: 'UPGRADE_PLAN_START',
  UPGRADE_PLAN_SUCCESS: 'UPGRADE_PLAN_SUCCESS',
  UPGRADE_PLAN_FAILURE: 'UPGRADE_PLAN_FAILURE',
  UPDATE_USAGE: 'UPDATE_USAGE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const planReducer = (state, action) => {
  switch (action.type) {
    case PLAN_ACTIONS.FETCH_PLANS_START:
    case PLAN_ACTIONS.FETCH_CURRENT_PLAN_START:
    case PLAN_ACTIONS.UPGRADE_PLAN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case PLAN_ACTIONS.FETCH_PLANS_SUCCESS:
      return {
        ...state,
        plans: action.payload,
        isLoading: false,
        error: null
      };
    
    case PLAN_ACTIONS.FETCH_CURRENT_PLAN_SUCCESS:
      return {
        ...state,
        currentPlan: action.payload.currentPlan,
        usage: action.payload.usage,
        isLoading: false,
        error: null
      };
    
    case PLAN_ACTIONS.UPGRADE_PLAN_SUCCESS:
      return {
        ...state,
        currentPlan: action.payload.newPlan,
        usage: action.payload.usage,
        isLoading: false,
        error: null
      };
    
    case PLAN_ACTIONS.FETCH_PLANS_FAILURE:
    case PLAN_ACTIONS.FETCH_CURRENT_PLAN_FAILURE:
    case PLAN_ACTIONS.UPGRADE_PLAN_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case PLAN_ACTIONS.UPDATE_USAGE:
      return {
        ...state,
        usage: { ...state.usage, ...action.payload }
      };
    
    case PLAN_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const PlanContext = createContext();

// Plan provider component
export const PlanProvider = ({ children }) => {
  const [state, dispatch] = useReducer(planReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Fetch plans
  const fetchPlans = async () => {
    dispatch({ type: PLAN_ACTIONS.FETCH_PLANS_START });
    
    try {
      const response = await apiService.getPlans();
      dispatch({
        type: PLAN_ACTIONS.FETCH_PLANS_SUCCESS,
        payload: response.plans
      });
    } catch (error) {
      dispatch({
        type: PLAN_ACTIONS.FETCH_PLANS_FAILURE,
        payload: error.response?.data?.error || 'Failed to fetch plans'
      });
    }
  };

  // Fetch current plan and usage
  const fetchCurrentPlan = async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: PLAN_ACTIONS.FETCH_CURRENT_PLAN_START });
    
    try {
      const response = await apiService.getCurrentPlan();
      dispatch({
        type: PLAN_ACTIONS.FETCH_CURRENT_PLAN_SUCCESS,
        payload: {
          currentPlan: response.currentPlan,
          usage: response.usage
        }
      });
    } catch (error) {
      dispatch({
        type: PLAN_ACTIONS.FETCH_CURRENT_PLAN_FAILURE,
        payload: error.response?.data?.error || 'Failed to fetch current plan'
      });
    }
  };

  // Upgrade plan
  const upgradePlan = async (planId) => {
    dispatch({ type: PLAN_ACTIONS.UPGRADE_PLAN_START });
    
    try {
      const response = await apiService.upgradePlan(planId);
      dispatch({
        type: PLAN_ACTIONS.UPGRADE_PLAN_SUCCESS,
        payload: {
          newPlan: response.newPlan,
          usage: response.usage
        }
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to upgrade plan';
      dispatch({
        type: PLAN_ACTIONS.UPGRADE_PLAN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Update usage (called after successful scan)
  const updateUsage = (usageData) => {
    dispatch({
      type: PLAN_ACTIONS.UPDATE_USAGE,
      payload: usageData
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: PLAN_ACTIONS.CLEAR_ERROR });
  };

  // Check if user can perform scan
  const canPerformScan = () => {
    if (!state.usage) return false;
    return state.usage.canPerformScan;
  };

  // Get remaining scans
  const getRemainingScans = () => {
    if (!state.usage) return 0;
    return state.usage.remainingScans;
  };

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Load current plan when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentPlan();
    }
  }, [isAuthenticated]);

  const value = {
    ...state,
    fetchPlans,
    fetchCurrentPlan,
    upgradePlan,
    updateUsage,
    clearError,
    canPerformScan,
    getRemainingScans
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};

// Custom hook to use plan context
export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

export default PlanContext;
