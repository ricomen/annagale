var submitStatus = false;
$(document).ready(function() {
    updateCart();
});

// Have an account
$(document).on('click', '#have-account', function (e) {
    e.preventDefault();
    $('.popup-has-acc').addClass('active');
});


$(document).on('click','#step-1 .status__const',function () {
    $('.popup-has-acc').addClass('active')
})

$(document).on('click', '#login-confirm', function (e) {
   e.preventDefault();
    $('p.error').remove();
    $('#login-form input').removeClass('error');

    $.ajax({
        url: 'index.php?route=checkout/checkout_two_step/login',
        type: 'post',
        dataType: 'json',
        data: $("#login-form").serialize(),
        success: function(json) {

            if (json['success']) {
                location.reload();
            }

            if(json['error']) {
                for(var key in json['error']) {
                    if(json['error'].hasOwnProperty(key)) {
                        // If you need to add error class to inputs
                        $('#login-form').find('input[name="' + key + '"]').addClass('error');

                        $('#login-form').find('[name="' + key + '"]').parent().append('<p class="error">' + json['error'][key] + '</p>');
                    }
                }
            }
        }
    });
});

// Show promocode
$(document).on('click', '#show-promo', function () {
    $(this).hide();
    $('#promo-form').removeAttr('style');
});

// Check coupon
$(document).on('click', '#promo-send', function(e) {
    e.preventDefault();
    $.ajax({
        url: '/index.php?route=checkout/checkout_two_step/coupon',
        type: 'post',
        data: 'coupon=' + $('input[name=\'coupon\']').val(),
        dataType: 'json',
        success: function(json) {
            $('input[name="coupon"]').removeClass('error');
            $('p.error').remove();

            if (json['error']) {
                // If you need to add error class to inputs
                $('input[name="coupon"]').addClass('error');
                $('input[name="coupon"]').parent().append('<p class="error">' + json['error'] + '</p>');
                updateCart();
                shippingMethods();
            }
            if (json['success']) {
                updateCart();
                shippingMethods();
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
});

// Remove product
$(document).on('click', '.remove', function () {
    if (!$('#confirm-block').find('.btn-order').hasClass('disabled')) {
        $('#confirm-block').find('.btn-order').addClass('disabled').prop('disabled', true);
    }

    var product_id = $(this).attr('data-cart-id');
    var product = JSON.parse($(this).attr('data-product'));

    if (dataLayer) {
        dataLayer.push({
            event: 'ecommerce',
            EE: 'RemoveFromCart',
            ecommerce: {
                remove: {
                    products: [{
                        id: product.id,
                        name: product.name,
                        category: product.category,
                        price: parseFloat(product.price.replace(' ', '')),
                        quantity: product.quantity
                    }]
                }
            }
        });

    }

    cart.remove(product_id);
    updateCart();
    setTimeout(function () {
        updateOrderAfterRemove();
        shippingMethods();
    }, 200);
});

// Change quantity (minus)
$(document).on('click', '.decrement', function() {
    var id = $(this).attr('data-id'),
        quantity = +$(this).attr('data-quantity') - 1;
    cart.update(id, quantity);
    updateCart();
});

// Change quantity (plus)
$(document).on('click', '.increment', function() {
    var id = $(this).attr('data-id'),
        quantity = +$(this).attr('data-quantity') + 1;
    cart.update(id, quantity);
    updateCart();
    
});

$(document).on('click','.js-slideUp',function () {
    $('#step-1-content .js-slideUp').css({"opacity":"0","visibility":"hidden"});
    $('#step-2-content .checkout-box__wrap').hide('slow');
    $('.step').removeClass('active');
    $('#step-1-content .step').addClass('active');
})

// Validate first step and go to second step
$('#next-step').on('click', function(e) {
    e.preventDefault();
    $('#step-1 select, input').removeClass('error-inp');
    $('p.error-inp').remove();
	var code = $('input[name=\'shipping_method\']:checked').val();
	var validateURL = 'index.php?route=checkout/checkout_two_step/validateStepFirst';
    if(typeof code !='undefined'){// если уже был переход к выбору способа доставки
		validateURL = 'index.php?route=checkout/checkout_two_step/validateStepFirstOnlyContacts';
    }
    $.ajax({
        url: validateURL,
        type: 'post',
        dataType: 'json',
        data: $("#step-1").serialize(),
        success: function(json) {
            if (json['success']) {

                $('.step').removeClass('active');
                $('#step-1-content .js-slideUp').css({"opacity":"1","visibility":"visible"});

                $('#step-1-content .checkout-box__wrap').hide('slow');
                $('#step-2-content .checkout-box__wrap').show('slow');
                $('#step-2-content .step').addClass('active');

                // Shipping methods
            //    shippingMethods();
                $('#payment-block .radio-block__box').addClass('disabled');
            }

            if(json['error']) {
                for(var key in json['error']) {
                    if(json['error'].hasOwnProperty(key)) {
                        // If you need to add error class to inputs
                        $('#step-1').find('input[name="' + key + '"]').addClass('error-inp');

                        $('#step-1').find('[name="' + key + '"]').parent().parent().append('<p class="error-inp">' + json['error'][key] + '</p>');
                    }
                }
                setTimeout(function () {
                    $('#step-1 select, input').removeClass('error-inp');
                    $('p.error-inp').hide('slow',function () {
                        $('p.error-inp').remove();

                    });
                },3000)
            }
        }
    });
});

// Change quantity (minus)
$(document).on('click', '.btn-minus_cart', function () {
    if(!$('#confirm-block').find('.btn-order').hasClass('disabled')) {
        $('#confirm-block').find('.btn-order').addClass('disabled').prop('disabled',true);
    }
    var id = $(this).attr('data-key'),
        quantity = +$(this).attr('data-quantity') - 1,
        product = $(this).attr('data-product');
    updateProdCart(id, quantity);
    cart.update(id, quantity);
    updateCart(product);
    shippingMethods();
});

// Change quantity (plus)
$(document).on('click', '.btn-plus_cart', function () {
    if(!$('#confirm-block').find('.btn-order').hasClass('disabled')) {
        $('#confirm-block').find('.btn-order').addClass('disabled').prop('disabled',true);
    }
    var id = $(this).attr('data-key'),
        quantity = +$(this).attr('data-quantity') + 1,
        product = $(this).attr('data-product');
    updateProdCart(id, quantity);
    cart.update(id, quantity);
    updateCart(product);
    shippingMethods();
});

// Submit
$('#confirm-block').on('click', 'input[type="submit"]', function () {
    if (!submitStatus) {
        submitStatus = true;
    }
});

function updateProdCart(key, quantity) {
    $.ajax({
        url: 'index.php?route=checkout/cart/edit',
        type: 'post',
        data: 'key=' + key + '&quantity=' + (typeof (quantity) != 'undefined' ? quantity : 1),
        dataType: 'json',

        success: function (json) {

            if (json['success']) {
                $('[data-for=\'popup-basket\'] .cout__holder').text(json['total'])
                $.get("index.php?route=common/cart/info",'.popup-basket', function (data) {
                    //	console.log(data);

                    // $('[data-for=\'popup-basket\']').remove()
                    // $('.popup.popup-basket').remove()
                    // $('[data-for=\'popup-personal\']:last').after(data)
                  	$(".popup-basket").html(data);
                    // $('.scroll-text').mCustomScrollbar();

                });
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}

// Get shipping methods
function shippingMethods() {
    $.ajax({
        url: 'index.php?route=checkout/shipping_method',
        dataType: 'html',
        success: function (html) {
            $('#shipping-block').html(html);
            if($('.form-delivery').children('.error-box-city').length) {
                $('.form-delivery').children('.error-box-city').remove();
            }
            $('input[name="shipping_method"]').removeAttr("checked");
            $('.ll_set_button').hide();
            $('#confirm-block').find('.btn-order').addClass('disabled').prop('disabled',true);
            setTimeout(function () {
                customeSelect.update('select');
                var code = $('input[name=\'shipping_method\']:checked').val();
                if(typeof code != 'undefined'){
                    if(code == 'll_cdek.ll_cdek_136' || code == 'll_cdek.ll_cdek_10' || code == 'll_cdek.ll_cdek_12' || code == 'll_cdek.ll_cdek_232' || code == 'll_cdek.ll_cdek_234' || code == 'll_cdek.ll_cdek_291' || code == 'll_cdek.ll_cdek_295' || code == 'll_cdek.ll_cdek_120') {
                        setTimeout(function () {
                            saveShippingAddress();
                        },200);
                    }
                    paymentMethods();
                }
            },200);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}

// Get payment methods
function paymentMethods() {
    $.ajax({
        url: 'index.php?route=checkout/payment_method',
        dataType: 'html',
        success: function (html) {
            $('#payment-block').html(html);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}

// On change country
$(document).on('change', '#input-country', function() {
	$('#confirm-block').find('.btn-order').addClass('disabled').prop('disabled',true);
});

// On change shipping method
$(document).on('change', 'input[name=\'shipping_method\']', function() {
	var code = $('input[name=\'shipping_method\']:checked').val();
	if(code == 'll_cdek.ll_cdek_136' || code == 'll_cdek.ll_cdek_10' || code == 'll_cdek.ll_cdek_12' || code == 'll_cdek.ll_cdek_232' || code == 'll_cdek.ll_cdek_234' || code == 'll_cdek.ll_cdek_291' || code == 'll_cdek.ll_cdek_295' || code == 'll_cdek.ll_cdek_120') {
		$(this).parent().find('.change_select').after($('.ll_set_button').text('Выбрать на карте').show().detach());
	} else {
		$('.ll_set_button').hide();
	}
	setShipping(code);
});

// On change box
$(document).on('change', 'input[name=\'box_type\']', function() {
	var code = $('input[name=\'box_type\']:checked').val();
	setBox(code);
});

// On change shipping CDEK
$(document).on('change', 'select.sel_chek', function() {
	saveShippingAddress();
});

// On click shipping CDEK
$(document).on('click', '#ll_cdek_map a.btn', function() {
	saveShippingAddress();
});

// On change payment method
$(document).on('change', 'input[name=\'payment_method\']', function() {
    var code = $('input[name=\'payment_method\']:checked').val();
    setPayment(code);
});

// On change comment
$('#comment').blur(function() {
    $.ajax({
        url: 'index.php?route=checkout/checkout_two_step/saveComment',
        type: 'post',
        data: 'message=' + $(this).val(),
        dataType: 'json',
        success: function (json) {},
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
});

// On change city
$(document).on('change', 'select[name=\'city_ref\']', function() {
    $.ajax({
        url: 'index.php?route=checkout/checkout_two_step/shippingFields',
        type: 'post',
        data: 'cityref=' + $(this).val(),
        dataType: 'json',
        success: function (json) {
            $('#additional-fields').html(json['fields']);
        //    customSelect.update('select');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
});

// On change department
$(document).on('change', 'select[name=\'warehouse_ref\']', function() {
    $.ajax({
        url: 'index.php?route=checkout/checkout_two_step/shippingFields',
        type: 'post',
        data: 'warehouseref=' + $(this).val(),
        dataType: 'json',
        success: function (json) {
            $('#additional-fields').html(json['fields']);
      //      customSelect.update('select');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
});

// On change address
$(document).on('change', 'input[name=\'city\'], input[name=\'street\'], input[name=\'house\'], input[name=\'postcode\'], input[name=\'apartment\']', function() {
	saveAddressFields();
});

// Save box
function setBox(code) {
	$.ajax({
		url: 'index.php?route=extension/module/selectbox',
		type: 'post',
		data: 'box_type=' + code,
		dataType: 'json',
		success: function (json) {
			updateCart();
			shippingMethods();
		},
		error: function (xhr, ajaxOptions, thrownError) {
			console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
		}
	});
}

// Save shipping method
function setShipping(code) {
    var comment = $('#comment').val();
    $.ajax({
        url: 'index.php?route=checkout/shipping_method/save',
        type: 'post',
        data: 'shipping_method=' + code + '&comment=' + comment,
        dataType: 'json',
        success: function (json) {
            shippingFields();
            updateCart();
            saveAddressFields();
            setTimeout(function () {
            	saveShippingMethod(code);
			},200);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}
function setShippingSdek(id) {
    var code = $('input[name=\'shipping_method\']:checked').val();
    var comment = $('#comment').val();
    $('span.error-inp').remove();
    $.ajax({
        url: 'index.php?route=checkout/shipping_method/save',
        type: 'post',
        data: 'shipping_method=' + code + '&comment=' + comment,
        dataType: 'json',
        success: function (json) {
            if(json['error']){
                var code_ship = $('input[name=\'shipping_method\']:checked').val();
                        $('#confirm-block').html('')
                        $('#cdek_selectedPvzInfo_'+code_ship.split('.')[1]).after('<span class="error-inp">'+json['error']['warning']+'</span>');
              $('#payment-block').html('')

                  }else{
                shippingFields();
                updateCart();
            }


        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}


// Save payment method
function setPayment(code) {
    var code_ship = $('input[name=\'shipping_method\']:checked').val();
    var comment = $('#comment').val();
var id = $('.sel_chek option:selected').val()

    if (typeof id !='undefined') {
        ll_cdek_set_pickup_id(id,'ll_cdek');
    }

    $('#shipping-block input').removeClass('error');
    $('p.error').remove();

    $.ajax({
        url: 'index.php?route=checkout/payment_method/save',
        type: 'post',
        data: 'payment_method=' + code + '&comment=' + comment + '&agree=1',
        dataType: 'json',
        success: function (json) {
          //  console.log(json);
            $.ajax({
                url: 'index.php?route=checkout/checkout_two_step/validateAddress',
                type: 'post',
                dataType: 'json',
                data: $("#shipping-block").serialize(),
                success: function(jsonCheck) {
                    if(jsonCheck['error']) {
                        for(var key in jsonCheck['error']) {
                            if(jsonCheck['error'].hasOwnProperty(key)) {
                                // If you need to add error class to inputs
                                $('#shipping-block').find('input[name="' + key + '"]').addClass('error');

                                $('#shipping-block').find('[name="' + key + '"]').parent().append('<p class="error">' + jsonCheck['error'][key] + '</p>');
                            }
                        }
                    }

                    if (jsonCheck['success']) {
                        setTimeout(function () {
                            $.ajax({
                                url: '/index.php?route=extension/payment/newsumm/sessionCheck',
						        type: 'post',
						        data: 'payment_method=' + code,
                                dataType: 'json',
                                success: function(json) {
									console.log(json);
                                },
                                error: function(xhr, ajaxOptions, thrownError) {
                                    console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
                                }
                            });
                        }, 200);
                        setTimeout(function () {
                            $.ajax({
                                url: 'index.php?route=checkout/checkout_two_step/confirmOrder',
                                dataType: 'html',
                                success: function(html) {
                                    updateOrder();
                                    $('#confirm-block').html(html);
                                    updateCart();
                                    saveAddressFields();
                                },
                                error: function(xhr, ajaxOptions, thrownError) {
                                    console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
                                }
                            });
                        }, 500);
                    }
                }
            });
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}

// Get additional shipping fields
function shippingFields() {
    $.ajax({
        url: 'index.php?route=checkout/checkout_two_step/shippingFields',
        type: 'post',
        dataType: 'json',
        success: function (json) {
            $('#additional-fields').html(json['fields']);
            setTimeout(function () {
                paymentMethods();
            }, 300);
        //    customSelect.update('select');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}

// Get cart
function updateCart(product = '') {
    $.ajax({
        url: 'https://annagale.ru/index.php?route=checkout/checkout_two_step/getCart',
        type: 'post',
        data: {'product': product},
        dataType: 'html',
        success: function (html) {
            $('#cart-block').html(html);
            // $('.scroll-text').mCustomScrollbar();
            updatePayForm();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}

// Add order info
function updateOrder() {
    $.ajax({
        url: 'index.php?route=checkout/checkout_two_step/updateOrder',
        dataType: 'json',
        success: function (json) {
            if (json['error']) {
                console.log(json['error']);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
        }
    });
}

//Updating the amount in payment forms
function updatePayForm() {
	var payment_method = $('input[name="payment_method"]:checked').val();
	if(typeof payment_method !== 'undefined') {
		var dataSend = {};
		if(payment_method == 'cod') {
			dataSend = {'order_id': $('#active_robo').children('input[name="InvId"]').val()};
		}
		$.ajax({
			url: '/index.php?route=extension/payment/newsumm',
			type: 'post',
			data: dataSend,
			dataType: 'json',
			success: function(json) {
				if(payment_method == 'cod') {
					$('#active_robo').children('input[name="OutSum"]').val(json['out_summ']);
					$('#active_robo').children('input[name="SignatureValue"]').val(json['signature']);
				}
				if(payment_method == 'pp_standard') {
					var totalSum = json['out_summ'];
					var position = $('#cart-block').find('li.items-box__list').length;
					var Sum = 0;
					for (i = 1; i <= position; i++) {
						Sum = Math.floor(Sum) + Math.floor($('#active_pp').children('input[name="amount_' + i + '"]').val());
					}
					if(Sum > totalSum) {
						if($('#active_pp').children('input[name="discount_amount_cart"]').length > 0) {
							$('#active_pp').children('input[name="discount_amount_cart"]').val(Sum  - totalSum);
						} else {
							$('#active_pp').append('<input type="hidden" name="discount_amount_cart" value="' + (Sum  - totalSum) + '">');
						}
						$('#active_pp').children('input[name="city"]').val(totalSum - Sum);
					} else {
						if($('#active_pp').children('input[name="discount_amount_cart"]').length > 0) {
							$('#active_pp').children('input[name="discount_amount_cart"]').remove();
						}
					}
				}
			},
			error: function(xhr, ajaxOptions, thrownError) {
				console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
			}
		});
	}
}

//Save address fields
function saveAddressFields() {
	var data = $('input[name=\'city\'], input[name=\'street\'], input[name=\'house\'], input[name=\'postcode\'], input[name=\'apartment\']');
	var code = $('input[name=\'shipping_method\']:checked').val();
	var btn = $('#confirm-block').find('.btn-order');
	$.ajax({
		url: 'index.php?route=checkout/checkout_two_step/saveAddressFields',
		type: 'post',
		data: data,
		dataType: 'json',
		success: function (json) {
			$('.row-address input').removeClass('error-inp');
			$('.form-delivery').children('.error-box').hide().text('');
			if ((json['error'] && code != 'll_cdek.ll_cdek_136' && code != 'll_cdek.ll_cdek_10' && code != 'll_cdek.ll_cdek_12' && code != 'll_cdek.ll_cdek_232' && code != 'll_cdek.ll_cdek_234' && code != 'll_cdek.ll_cdek_291' && code != 'll_cdek.ll_cdek_295' && code != 'll_cdek.ll_cdek_120') || code == 'pickup.pickup' || (code == 'free.free' && json['error'])) {
				btn.addClass('disabled').prop('disabled',true);
				if (json['error'] && code != 'll_cdek.ll_cdek_136' && code != 'll_cdek.ll_cdek_10' && code != 'll_cdek.ll_cdek_12' && code != 'll_cdek.ll_cdek_232' && code != 'll_cdek.ll_cdek_234' && code != 'll_cdek.ll_cdek_291' && code != 'll_cdek.ll_cdek_295' && code != 'll_cdek.ll_cdek_120' && code != 'pickup.pickup') {
					for (var key in json['error']) {
						if (json['error'].hasOwnProperty(key)) {
							// If you need to add error class to inputs
							$('.row-address input[name="' + key + '"]').addClass('error-inp');
							$('.form-delivery').children('.error-box').show().text(json['error'][key]);
						}
					}
				}
			} else {
				if($('#confirm-block').find('form').length && $('input[name="shipping_method"]:checked').length && $('input[name="payment_method"]:checked').length) {
					if($('input[name="payment_method"]:checked').val() !== 'robokassa' || ($('input[name="payment_method"]:checked').val() == 'robokassa' && Number($('#active_robo').children('input[name="OutSum"]').val()) == 1000)) {
						btn.removeClass('disabled').prop('disabled',false);
					}
					if($('input[name="payment_method"]:checked').val() == 'robokassa' && Number($('#active_robo').children('input[name="OutSum"]').val()) !== 1000) {
						updatePayForm();
					}
				}
			}
			if(code == 'll_cdek.ll_cdek_136' || code == 'll_cdek.ll_cdek_10' || code == 'll_cdek.ll_cdek_12' || code == 'll_cdek.ll_cdek_232' || code == 'll_cdek.ll_cdek_234' || code == 'll_cdek.ll_cdek_291' || code == 'll_cdek.ll_cdek_295' || code == 'll_cdek.ll_cdek_120') {
				setTimeout(function () {					
					saveShippingAddress();
				},200);
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
		}
	});
}

// Save shipping address
function saveShippingAddress() {
	$.ajax({
	    url: 'index.php?route=checkout/checkout_two_step/saveShippingAddress',
	    type: 'post',
	    data: 'pvz=' + $('.sel_chek option:selected').text(),
	    dataType: 'json',
	    success: function (json) {
	    	 console.log(json);
	    },
	    error: function (xhr, ajaxOptions, thrownError) {
	        console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
	    }
	});
}
// Save shipping method
function saveShippingMethod(code) {
	$.ajax({
	    url: 'index.php?route=checkout/checkout_two_step/saveShippingMethod',
	    type: 'post',
	    data: 'shipping_method=' + code,
	    dataType: 'json',
	    success: function (json) {
	    	 console.log(json);
	    },
	    error: function (xhr, ajaxOptions, thrownError) {
	        console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
	    }
	});
}
// Updating an order after deleting an item from the cart
function updateOrderAfterRemove() {
	$.ajax({
	    url: '/index.php?route=extension/payment/newsumm/updateOrderAfterRemove',
	    type: 'post',
	    dataType: 'json',
	    success: function (json) {
	    	 console.log(json);
	    },
	    error: function (xhr, ajaxOptions, thrownError) {
	        console.log(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
	    }
	});
}