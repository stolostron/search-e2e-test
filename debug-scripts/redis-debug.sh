#!/bin/bash

# HOW TO RUN THIS SCRIPT:
# oc login ... <RHACM Hub>
# oc exec -it search-redisgraph-0 -n open-cluster-management -- /bin/bash < redis-debug.sh

# DESCRIPTION:
# This script collects data about the Redisgraph instance usage by RHACM to debug issues with the search service.
# Output data is anonymized and only shows total counts of different resources.

# DATA COLLECTED:
# 1. Redis INFO (https://redis.io/commands/info)
# 2. RHACM Resource Statistics:
#    - Total Resource count
#    - Total uids (must match total resources, uid duplication causes problems)
#    - Total Cluster count
#    - Resource count by cluster
#    - Resource count by kind
#    - Namespaces count by cluster
#    - Resource count per cluster/namespace
#    - Kubernetes node count by cluster
#    - Resources containing too many labels.
# 3. RHACM Edges Statistics:
#    - Total Edge count
#    - Edge count by cluster
#    - Total Inter-cluster edges count
#    - Intercluster edge count by cluster (hub to cluster)
#    - Edges by edge type


export REDISCLI_AUTH=$REDIS_PASSWORD

printf "\n\n----- COLLECT DEBUG INFORMATION FROM REDIS -----\n"
printf "\n\n>>> Redis INFO:\n"
redis-cli INFO


printf "\n\n----- COLLECT RESOURCE STATISTICS -----\n"
printf "\n\n>>> Total Resource count:\n"
redis-cli --csv graph.query search-db "MATCH (n) RETURN count(n)"

printf "\n\n>>> Total uids (must match total resources):\n"
redis-cli --csv graph.query search-db "MATCH (n) RETURN DISTINCT COUNT(n._uid)"

printf "\n\n>>> Total Cluster count:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster) RETURN count(c)"

printf "\n\n>>> Hub cluster ID (used to analyze the data below because cluster names have been anonymized):\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster) WHERE c.name = 'local-cluster' RETURN ID(c)"

printf "\n\n>>> Resource count by cluster (using anonymous ID):\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n) WHERE c.name = n.cluster RETURN DISTINCT ID(c), COUNT(n) ORDER BY COUNT(n.cluster) DESC"

printf "\n\n>>> Resource count by kind:\n"
redis-cli --csv graph.query search-db "MATCH (n) RETURN LABELS(n), COUNT(n) ORDER BY COUNT(n) DESC"

printf "\n\n>>> Namespaces count by cluster (using anonymous ID):\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n:Namespace) RETURN DISTINCT ID(c), COUNT(n) ORDER BY COUNT(n) DESC"

printf "\n\n>>> Resource count by cluster and namespace:\n"
redis-cli --no-raw graph.query search-db "MATCH (c:Cluster)-[]-(ns:Namespace) WITH c.name AS c_name, ID(c) AS c_id, ID(ns) AS ns_id, ns.name AS ns_name MATCH (r) WHERE r.cluster=c_name AND r.namespace = ns_name RETURN DISTINCT c_id, ns_id, count(r) ORDER BY count(r) DESC"
printf "\nCSV format:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(ns:Namespace) WITH c.name AS c_name, ID(c) AS c_id, ID(ns) AS ns_id, ns.name AS ns_name MATCH (r) WHERE r.cluster=c_name AND r.namespace = ns_name RETURN DISTINCT c_id, ns_id, count(r) ORDER BY count(r) DESC"

printf "\n\n>>> Kubernetes node count and memory by cluster:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster) RETURN ID(c), c.nodes, c.memory ORDER BY COUNT(c.nodes) DESC"

printf "\n\n>>> Resources with > 5 labels by cluster:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n) WHERE size(n.label) > 5 RETURN DISTINCT ID(c), COUNT(n) ORDER BY COUNT(n) DESC"

printf "\n\n>>> Resources with > 10 labels:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n) WHERE size(n.label) > 10 RETURN DISTINCT ID(c), COUNT(n) ORDER BY COUNT(n) DESC"

printf "\n\n>>> Resources with > 20 labels:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n) WHERE size(n.label) > 20 RETURN DISTINCT ID(c), COUNT(n) ORDER BY COUNT(n) DESC"

printf "\n\n>>> Kubernetes label counts by cluster:\n"
redis-cli --no-raw graph.query search-db "MATCH (c:Cluster)-[]-(n) RETURN ID(c), count(n) as num_nodes, size(n.label) ORDER BY size(n.label) DESC"
printf "\nCSV format:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n) RETURN ID(c), count(n) as num_nodes, size(n.label) ORDER BY size(n.label) DESC"


printf "\n\n----- COLLECT EDGES STATISTICS -----\n"
printf "\n\n>>> Total Edges count:\n"
redis-cli --csv graph.query search-db "MATCH ()-[e]-() RETURN count(e)"

printf "\n\n>>> Edge count by cluster (using Cluster node):\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n1)-[e]-(n2) WHERE n1.cluster = n2.cluster RETURN DISTINCT ID(c), COUNT(e) ORDER BY COUNT(e) DESC"

printf "\n\n>>> Total Intercluster Edge count:\n"
redis-cli --csv graph.query search-db "MATCH (n1)-[e]-(n2) WHERE n1.cluster<>n2.cluster RETURN count(e)"

printf "\n\n>>> Total Intercluster Edge count (using edge property):\n"
redis-cli --csv graph.query search-db "MATCH ()-[e]-() WHERE exists(e._interCluster) RETURN count(e)"

printf "\n\n>>> Intercluster Edge count by cluster ID:\n"
redis-cli --csv graph.query search-db "MATCH (c:Cluster)-[]-(n1)-[e]-(n2) WHERE n1.cluster <> n2.cluster RETURN DISTINCT ID(c), COUNT(e) ORDER BY COUNT(e) DESC"

printf "\n\n>>> Edge count by type:\n"
redis-cli --csv graph.query search-db "MATCH ()-[e]->() RETURN DISTINCT count(e), type(e), e._interCluster ORDER BY count(e) DESC"
