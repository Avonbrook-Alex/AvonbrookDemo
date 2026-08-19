import { Quotation } from './quotation.model';

export type QuotationSectionId = 'customer' | 'requirements' | 'vehicle' | 'accessories' | 'tradein' | 'pricing' | 'finance' | 'notes';

export function missingQuotationFields(quotation: Quotation, section: QuotationSectionId): string[] {
  switch (section) {
    case 'customer':
      return [
        !quotation.contact.firstName && !quotation.contact.company ? 'customer name or company' : '',
        !quotation.contact.address1 ? 'address' : '',
        !quotation.contact.mobile ? 'phone number' : '',
      ].filter(Boolean);
    case 'requirements':
      return [
        !quotation.contact.vehicleType ? 'vehicle type' : '',
        !quotation.requirements.requiredDate ? 'required date' : '',
        !quotation.requirements.modelRange ? 'model range' : '',
      ].filter(Boolean);
    case 'vehicle':
      return [
        !quotation.vehicle.modelDescription ? 'vehicle model' : '',
        !quotation.vehicle.stockNumber ? 'stock number' : '',
        !quotation.vehicle.retailPrice ? 'retail price' : '',
      ].filter(Boolean);
    case 'accessories':
      return quotation.accessories.some((item) => !item.description || item.quantity < 1 || item.price < 0)
        ? ['valid accessory details']
        : [];
    case 'tradein':
      return [
        quotation.tradeIn.regNo && !quotation.tradeIn.modelDescription ? 'trade-in model' : '',
        quotation.tradeIn.regNo && !quotation.tradeIn.estimatedValue ? 'estimated value' : '',
      ].filter(Boolean);
    case 'pricing':
      return quotation.pricing.totalPayment > 0 ? [] : ['vehicle and pricing total'];
    case 'finance':
      return quotation.finance.arrangedByCustomer || (!quotation.finance.provider && !quotation.finance.monthlyPayment)
        ? []
        : [
            !quotation.finance.provider ? 'finance provider' : '',
            !quotation.finance.installments ? 'repayment count' : '',
            !quotation.finance.monthlyPayment ? 'monthly payment' : '',
          ].filter(Boolean);
    case 'notes':
      return [];
  }
}

export function quotationSectionHasData(quotation: Quotation, section: QuotationSectionId): boolean {
  switch (section) {
    case 'customer':
      return Boolean(Object.values(quotation.contact).some(Boolean));
    case 'requirements':
      return Boolean(
        quotation.contact.vehicleType ||
        quotation.requirements.modelRange ||
        quotation.requirements.generalSize ||
        quotation.requirements.category ||
        quotation.requirements.colour ||
        quotation.requirements.comments,
      );
    case 'vehicle':
      return Boolean(Object.values(quotation.vehicle).some(Boolean));
    case 'accessories':
      return quotation.accessories.length > 0;
    case 'tradein':
      return Boolean(Object.values(quotation.tradeIn).some(Boolean));
    case 'pricing':
      return quotation.pricing.totalPayment > 0;
    case 'finance':
      return quotation.finance.arrangedByCustomer || Boolean(quotation.finance.provider || quotation.finance.monthlyPayment);
    case 'notes':
      return Boolean(quotation.comments.trim());
  }
}
