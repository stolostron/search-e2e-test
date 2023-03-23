#!/bin/bash

###############################################################################
# Copyright Contributors to the Open Cluster Management project
###############################################################################

####################
## COLORS
####################
BLUE="\033[0;34m"
CYAN="\033[0;36m"
GREEN="\033[0;32m"
PURPLE="\033[0;35m"
RED="\033[0;31m"
YELLOW="\033[0;33m"

HIGHLIGHT_BLUE="\033[0;44m"
HIGHLIGHT_CYAN="\033[0;46m"
HIGHLIGHT_GREEN="\033[0;42m"
HIGHLIGHT_PURPLE="\033[0;45m"
HIGHLIGHT_RED="\033[0;41m"
HIGHLIGHT_YELLOW="\033[0;43m"

NC="\033[0m"

log_color () {
  case $1 in
    blue)
      echo -e "${BLUE}$2 ${NC}"$3
    ;;
    cyan)
      echo -e "${CYAN}$2 ${NC}"$3
    ;;
    green)
      echo -e "${GREEN}$2 ${NC}"$3
    ;;
    purple)
      echo -e "${PURPLE}$2 ${NC}"$3
    ;;
    red)
      echo -e "${RED}$2 ${NC}"$3
    ;;
    yellow)
      echo -e "${YELLOW}$2 ${NC}"$3
    ;;
  esac
}

log_color_with_highlight () {
  case $1 in
    blue)
      echo -e "${HIGHLIGHT_BLUE}$2 ${NC}"$3
    ;;
    cyan)
      echo -e "${HIGHLIGHT_CYAN}$2 ${NC}"$3
    ;;
    green)
      echo -e "${HIGHLIGHT_GREEN}$2 ${NC}"$3
    ;;
    purple)
      echo -e "${HIGHLIGHT_PURPLE}$2 ${NC}"$3
    ;;
    red)
      echo -e "${HIGHLIGHT_RED}$2 ${NC}"$3
    ;;
    yellow)
      echo -e "${HIGHLIGHT_YELLOW}$2 ${NC}"$3
    ;;
  esac
}
