/** *****************************************************************************
 * Licensed Materials - Property of Red Hat, Inc.
 * Copyright (c) 2020 Red Hat, Inc.
 ****************************************************************************** */

/**
 * Centralized PatternFly 6 selectors for ACM console e2e tests.
 */

const pfClass = (component) => `.pf-v6-c-${component}`
const pfMod = (modifier) => `.pf-m-${modifier}`

export const pf = {
  // Accordion
  accordion: {
    toggle: pfClass('accordion__toggle'),
    toggleText: pfClass('accordion__toggle-text'),
  },

  // Alert
  alert: {
    base: pfClass('alert'),
    title: pfClass('alert__title'),
    inlineDanger: `${pfClass('alert')}${pfMod('inline')}${pfMod('danger')}`,
  },

  // App Launcher
  appLauncher: {
    base: pfClass('app-launcher'),
    alignRight: `${pfClass('app-launcher')}${pfMod('align-right')}`,
  },

  // Button
  button: {
    base: pfClass('button'),
    primary: `${pfClass('button')}${pfMod('primary')}`,
    danger: `button${pfMod('danger')}`,
    plain: `${pfClass('button')}${pfMod('plain')}`,
  },

  // Card
  card: {
    base: pfClass('card'),
    header: pfClass('card__header'),
    title: pfClass('card__title'),
  },

  // Label Group (was Chip Group in PF5)
  labelGroup: {
    list: pfClass('label-group__list'),
  },

  // Chip Group (legacy alias for Label Group)
  chipGroup: {
    list: pfClass('label-group__list'),
  },

  // Dropdown
  dropdown: {
    toggle: pfClass('dropdown__toggle'),
    menuItem: `button${pfClass('dropdown__menu-item')}`,
  },

  // Empty State
  emptyState: {
    icon: pfClass('empty-state__icon'),
  },

  // Expandable Section
  expandableSection: {
    base: pfClass('expandable-section'),
    toggle: pfClass('expandable-section__toggle'),
  },

  // Form
  form: {
    groupControl: pfClass('form__group-control'),
  },

  // Log Viewer
  logViewer: {
    text: pfClass('log-viewer__text'),
  },

  // Login
  login: {
    main: pfClass('login__main'),
  },

  // Menu
  menu: {
    list: pfClass('menu__list'),
    content: pfClass('menu__content'),
  },

  // Menu Toggle
  menuToggle: {
    base: pfClass('menu-toggle'),
    button: `button${pfClass('menu-toggle')}`,
    text: pfClass('menu-toggle__text'),
  },

  // Modal
  modal: {
    box: pfClass('modal-box'),
    header: pfClass('modal-box__header'),
  },

  // Navigation
  nav: {
    link: pfClass('nav__link'),
  },

  // Tabs
  tabs: {
    link: pfClass('tabs__link'),
    item: pfClass('tabs__item'),
  },

  // Page
  page: {
    header: pfClass('page__header'),
    main: pfClass('page__main'),
    mainSection: pfClass('page__main-section'),
  },

  // Pagination
  pagination: {
    base: pfClass('pagination'),
  },

  // Select
  select: {
    base: pfClass('select'),
    menu: `ul${pfClass('select__menu')}`,
  },

  // Skeleton
  skeleton: {
    base: pfClass('skeleton'),
  },

  // Table
  table: {
    base: `table${pfClass('table')}`,
  },

  // Text Input Group
  textInputGroup: {
    textInput: pfClass('text-input-group__text-input'),
  },

  // Title (PF6 uses different size classes)
  title: {
    h1: `h1${pfClass('title')}`,
    h4: `h4${pfClass('title')}`,
    h4Md: `h4${pfClass('title')}`, // PF6 dropped size modifiers on title
    div: `div${pfClass('title')}`,
  },

  // Layout - Bullseye (loading overlay)
  layout: {
    bullseye: '.pf-v6-l-bullseye',
  },

  // Modifiers
  mod: {
    primary: pfMod('primary'),
    danger: pfMod('danger'),
    plain: pfMod('plain'),
    inline: pfMod('inline'),
    alignRight: pfMod('align-right'),
    md: pfMod('md'),
  },
}

export default pf
