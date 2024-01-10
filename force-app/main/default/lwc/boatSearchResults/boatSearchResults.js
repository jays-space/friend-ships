import { LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

// APEX METHODS
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import updateBoatList from "@salesforce/apex/BoatDataService.updateBoatList";

// Import message service features required for publishing and the message channel
import { publish, MessageContext } from "lightning/messageService";
import boatMessageChannel from "@salesforce/messageChannel/boatMessageChannel__c";

// ...
const SUCCESS_TITLE = "Success";
const MESSAGE_SHIP_IT = "Ship it!";
const SUCCESS_VARIANT = "success";
const ERROR_TITLE = "Error";
const ERROR_VARIANT = "error";

export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  columns = [];
  boatTypeId = "";
  boats;
  isLoading = false;

  // wired message context
  @wire(MessageContext) messageContext;

  // wired getBoats method
  @wire(getBoats, {
    boatTypeId: "$boatTypeId"
  })
  wiredBoats(result) {
    this.isLoading = true;
    if (result.data) {
      this.boats = result.data;
      this.columns = [
        { label: "Name", fieldName: "Name", type: "text", editable: true },
        {
          label: "Length",
          fieldName: "Length__c",
          type: "number",
          editable: true
        },
        {
          label: "Price",
          fieldName: "Price__c",
          type: "currency",
          currencyDisplayAs: "symbol",
          maximumFractionDigits: "2",
          editable: true
        },
        {
          label: "Description",
          fieldName: "Description__c",
          type: "text",
          editable: true
        }
      ];
      this.isLoading = false;
    } else if (result.error) {
      this.boats = undefined;
      this.isLoading = false;
    }
  }

  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  searchBoats(boatTypeId) {}

  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  refresh() {
    refreshApex();
  }

  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
  }

  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    // explicitly pass boatId to the parameter recordId
    const payload = { recordId: boatId };
    publish(this.messageContext, boatMessageChannel, payload);
  }

  createToastEvent(variant = "success", title, message) {
    const event = new ShowToastEvent({
      title,
      message,
      variant
    });

    return event;
  }

  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    const updatedFields = event.detail.draftValues;

    // Update the records via Apex
    updateBoatList({ data: updatedFields })
      .then(() => {
        // fire toast message => success
        this.dispatchEvent(
          this.createToastEvent(SUCCESS_VARIANT, SUCCESS_TITLE, MESSAGE_SHIP_IT)
        );
        
        // trigger loading spinner
        this.refresh();
      })
      .catch((error) => {
        // fire toast message => error
      })
      .finally(() => {});
  }

  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {}
}
