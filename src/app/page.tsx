"use client";

// all react and zod related imports
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn, UseFormProps } from 'react-hook-form';
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
  const [selectedFromCurrency, setSelectedFromCurrency] = useState('');
  const [selectedToCurrency, setSelectedToCurrency] = useState('');
  const [result, setResult] = useState("");
  const [currenciesSwapped, setCurrenciesSwapped] = useState(false);

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
      const regex = /^(?:\d+(?:,\d{2})*(?:,\d{3})?(?:\.\d+)?|\d+(?:\.\d+)?(?:\s*lakhs?|crores?)?)$/i;
      return regex.test(amount.replace(/\s+/g, ""));
    } else if (currency === "USD") {
      const regex = /^(?:[0-9]+(?:,[0-9]{3})*(?:\.\d+)?|[0-9]+(?:\.\d+)?)$/;
      return regex.test(amount);
    }
    return false;
  }  

  // form schema for validation
  const formSchema = (selectedCurrency: string) => {
    return z.object({
      amount: z.string().refine(
        (data) => validateAmount(data, selectedCurrency),
        {
          message:
            selectedCurrency === "INR"
              ? "Invalid INR format or comma placement. The first comma comes after the first three digits from the right (for thousands), and subsequent commas appear after every two digits. "
              : "Invalid USD format or comma placement. The comma should be every after 3 digits.",
        }
      ),
      
      fromCurrency: z.string({
        required_error: "Please select a currency.",
      }),
      toCurrency: z.string({
        required_error: "Please select a currency.",
      }),
    });
  };

  // const form = useForm<FormValues>({
  //   resolver: zodResolver(formSchema(selectedFromCurrency)),
  // }) as UseFormReturn<FormValues>;

  // zod resolver for validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(selectedFromCurrency)),
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
    // console.log(values)
    let amount = formatValue(values.amount);
    setResult((Number(amount) * rate).toFixed(2));
  }

  const handleSwitchClick = () => {
    if (currenciesSwapped) {
      form.setValue("fromCurrency", selectedFromCurrency);
      form.setValue("toCurrency", selectedToCurrency);
    } else {
      form.setValue("fromCurrency", selectedToCurrency);
      form.setValue("toCurrency", selectedFromCurrency);
    }

    setCurrenciesSwapped(!currenciesSwapped);
    form.trigger("amount"); 
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl py-8 text-teal-500">Currency Converter</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-8">
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
          <div className="flex max-w-lg items-center justify-center">
            <FormField
              control={form.control}
              name="fromCurrency"
              render={({ field }) => (
                <FormItem className="flex flex-col mr-4">
                  <FormLabel>fromCurrency</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          defaultValue={selectedFromCurrency}
                          className={cn(
                            "w-[200px] justify-between",
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
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Currency..." />
                        <CommandEmpty>No framework found.</CommandEmpty>
                        <CommandGroup className="h-[300px] overflow-auto">
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
              className="h-12 w-12 mr-4 hover:bg-teal-100 px-2 py-2 border flex transform rotate-90 items-center justify-center border-teal-500 rounded-full"
            >
               <IoSwapVerticalSharp size={20} className="text-teal-500" />
            </button>
            <FormField
              control={form.control}
              name="toCurrency"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>toCurrency</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"

                          defaultValue={selectedToCurrency}
                          className={cn(
                            "w-[200px] justify-between",
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
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Currency..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup className="h-[300px] overflow-auto">
                          {Object.keys(exchangeRates).map((currency) => (
                            <CommandItem
                              value={currency}
                              key={exchangeRates.language}
                              onSelect={() => {
                                form.setValue("toCurrency", currency);
                                setSelectedToCurrency(currency)
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
      <p className="text-4xl py-8 text-teal-500">{result}</p>
    </main>
  );
}
