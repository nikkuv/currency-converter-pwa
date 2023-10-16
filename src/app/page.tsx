"use client";

// all react and zod related imports
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LuChevronsUpDown } from "react-icons/lu";
import { IoSwapVerticalSharp } from "react-icons/io5";

//shadcn UI components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// API to get conversion rate
const API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

// form type
type FormValues = {
  amount: string;
  fromCurrency: string;
  toCurrency: string;
};

// exchange rate API type
interface ExchangeRates {
  [key: string]: number;
}

export default function Home() {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [selectedFromCurrency, setSelectedFromCurrency] = useState("USD");
  const [selectedToCurrency, setSelectedToCurrency] = useState("INR");
  const [result, setResult] = useState("");

  // fatch the data from the API
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setExchangeRates(data.rates))
      .catch((err) => console.error(err));
  }, []);

  // validate amount
  function validateAmount(amount: string, currency: string): boolean {
    if (currency === "INR") {
      const regex =
        /^(?:\d+(?:,\d{2})*(?:,\d{3})?(?:\.\d+)?|\d+(?:\.\d+)?(?:\s*lakhs?|crores?|rupees?)?)$/i;
      return regex.test(amount.replace(/\s+/g, ""));
    } else if (currency === "USD") {
      const regex = /^(?:[0-9]+(?:,[0-9]{3})*(?:\.\d+)?|[0-9]+(?:\.\d+)?)$/;
      return regex.test(amount);
    }
    const regex = /^\d+$/;
    return regex.test(amount);
  }

  // form schema for validation
  const formSchema = (selectedCurrency: string) => {
    return z.object({
      amount: z
        .string()
        .refine((data) => validateAmount(data, selectedCurrency), {
          message:
            selectedCurrency === "INR"
              ? "Invalid INR format or comma placement. The first comma comes after the first three digits from the right (for thousands), and subsequent commas appear after every two digits."
              : selectedCurrency === "USD"
              ? "Invalid USD format or comma placement. The comma should be every after 3 digits."
              : "Invalid currency",
        }),

      fromCurrency: z.string({
        required_error: "Please select a currency.",
      }),
      toCurrency: z.string({
        required_error: "Please select a currency.",
      }),
    });
  };

  // zod resolver for validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(selectedFromCurrency)),
    defaultValues: {
      fromCurrency: selectedFromCurrency,
      toCurrency: selectedToCurrency,
    },
  });

  const formatValue = (val: string) => {
    // Convert to the numerical value in rupees
    let numericValue = `${val}`.replace(/,/g, "");
    let words = numericValue.split(/\s+/);

    if (words[1]) {
      switch (words[1].toLowerCase()) {
        case "lakh":
        case "lakhs":
          numericValue = (parseFloat(words[0]) * 100000).toString();
          break;
        case "crore":
        case "crores":
          numericValue = (parseFloat(words[0]) * 10000000).toString();
          break;
        case "rupee":
        case "rupees":
          numericValue = (parseFloat(words[0])).toString();
        default:
          numericValue = parseFloat(words[0]).toString();
      }
    } else {
      numericValue = parseFloat(numericValue).toString();
    }

    return Number(numericValue).toFixed(2);
  };

  function onSubmit() {
    const values = form.getValues();
    const rate =
      exchangeRates[values.toCurrency] / exchangeRates[values.fromCurrency];
    let amount = formatValue(values.amount);
    setResult((Number(amount) * rate).toFixed(2));
  }

  const handleSwitchClick = () => {
    // Get current values from the form.
    const currentFromCurrency = form.getValues("fromCurrency");
    const currentToCurrency = form.getValues("toCurrency");

    // Swap the values.
    form.setValue("fromCurrency", currentToCurrency);
    form.setValue("toCurrency", currentFromCurrency);

    // Update the state.
    setSelectedFromCurrency(currentToCurrency);

    // Trigger the validation for the 'amount' field.
    form.trigger("amount");
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center p-4 md:p-24">
      <h1 className="text-4xl py-8 text-teal-500">Currency Converter</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full md:max-w-lg space-y-4 md:space-y-8"
        >
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      selectedFromCurrency === "INR"
                        ? "Enter the amount in INR"
                        : `Enter the amount`
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-6 items-stretch md:gap-0 md:flex-row max-w-lg justify-center">
            <FormField
              control={form.control}
              name="fromCurrency"
              render={({ field }) => (
                <FormItem className="flex flex-col md:mr-4">
                  <FormLabel>From Currency</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          defaultValue={selectedFromCurrency}
                          className={cn(
                            "flex w-full md:inline-flex md:w-[215px] w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? Object.keys(exchangeRates).find(
                                (currency) => currency === field.value
                              )
                            : "select currency"}
                          <LuChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[215px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Currency..." />
                        <CommandEmpty>No framework found.</CommandEmpty>
                        <CommandGroup className="h-[250px] overflow-auto">
                          {Object.keys(exchangeRates).map((currency) => (
                            <CommandItem
                              value={currency}
                              key={exchangeRates.language}
                              onSelect={() => {
                                form.setValue("fromCurrency", currency);
                                setSelectedFromCurrency(currency);
                              }}
                            >
                              {currency}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="button"
              onClick={handleSwitchClick}
              className="h-12 w-12 md:mt-4 self-center md:mt-0 md:mr-4 hover:bg-teal-100 px-2 py-2 border flex transform rotate-90 items-center justify-center border-teal-500 rounded-full"
            >
              <IoSwapVerticalSharp size={20} className="text-teal-500" />
            </button>
            <FormField
              control={form.control}
              name="toCurrency"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>To Currency</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          defaultValue={selectedToCurrency}
                          className={cn(
                            "w-full md:w-[215px] w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? Object.keys(exchangeRates).find(
                                (currency) => currency === field.value
                              )
                            : "select currency"}
                          <LuChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[215px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Currency..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup className="h-[250px] overflow-auto">
                          {Object.keys(exchangeRates).map((currency) => (
                            <CommandItem
                              value={currency}
                              key={exchangeRates.language}
                              onSelect={() => {
                                form.setValue("toCurrency", currency);
                                setSelectedToCurrency(currency);
                              }}
                            >
                              {currency}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            className="mx-auto w-full bg-teal-500 hover:bg-teal-700"
            type="submit"
          >
            Submit
          </Button>
        </form>
      </Form>
      <p className="text-2xl md:text-4xl py-4 md:py-8 text-teal-500">{result}</p>
    </main>
  );
}
