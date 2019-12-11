EDIT_CONFIG=$([[ $(kubectl get configmap my-test-config -n kube-system -o yaml) =~ "key4: config4" ]] && echo "edited")
DEL_DPLMT=$(kubectl get deployment my-test-deployment -n kube-system &> /dev/null || echo "deleted")
if [ $EDIT_CONFIG == "edited" ] && [ $DEL_DPLMT == "deleted" ]
then
echo "Delete deployment and edit configmap yaml works as expected"
else
echo -e "Error: Edit and delete not working as expected"
exit 1
fi
