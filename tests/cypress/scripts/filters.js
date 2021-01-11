/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

import { searchPage, searchBar } from '../views/search'

export const simple = (filter) =>   {
  it('should suggest values', function() {
    searchBar.whenEnterTextInSearchBar(filter.type)
    searchBar.shouldSuggestValues()
  })

  if (filter.values) {
    filter.values.forEach((value) => {
      it('should filter by ' + value.label, function() {
        searchBar.whenEnterTextInSearchBar(filter.type)
        value.add()
        isValidSearchQuery()
      })
    })
  }
}

export const combine = (filter, dependant) => {
  if (filter.values && dependant.values) {
    filter.values.forEach((value) => {
      dependant.values.forEach((depValue) => {
        it('should filter by combination with "' + value.label + '" value and "' + dependant.type + '" filter with "' + depValue.label + '" value', function() {
          searchBar.whenEnterTextInSearchBar(filter.type)
          value.add()
          searchBar.whenEnterTextInSearchBar(dependant.type)
          depValue.add()
          isValidSearchQuery()
        })
      })
    })
  }  
}

export function combined(depsFilters) {
  return (filter) => {
    depsFilters.forEach((dependant) => {
      combine(filter, dependant)
    })
  }
}

export function multipleValues(numValues) {
  return (filter) => {
    it('should filter by multiple values', function() {
      for (var idx = 1; idx <= numValues; idx++) {
        searchBar.whenEnterTextInSearchBar(filter.type)
        searchBar.whenSelectFirstSuggestedValue()
      }

      isValidSearchQuery()
    })
  }
}

export function useText(value, next) {
  return { label: value, add: () => searchBar.whenEnterTextInSearchBar(value, next) }
}

export function useNextSuggestion() {
  return { label: 'next suggestion', add: () => searchBar.whenSelectFirstSuggestedValue() }
}

export const filtersRegistry = {
  filters : [],
  createFilter: function(type, options) {
    if (!options) {
      options = {}
    }
  
    // Use first suggestion value by default
    if (!options.values) {
      options.values = [useNextSuggestion()]
    }
  
    // Add common strategies
    if (!options.strategies) {
      options.strategies = [simple]
    } else {
      options.strategies.unshift(simple)
    }
  
    var filter = { type: type, values: options.values, strategies: options.strategies }
    filtersRegistry.filters.push(filter)
    return filter
  }
}

function isValidSearchQuery() {
  searchPage.shouldValidateSearchQuery()
}

